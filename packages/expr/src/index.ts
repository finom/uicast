import type * as acorn from "acorn";
import { Budget, DEFAULT_BUDGET, type BudgetOptions } from "./budget";
import { compileAst, type Runtime, type Thunk } from "./interpret/compile";
import { compileNative, type CompiledNative } from "./native/compile";
import { ExpressionError, type ExpressionErrorReason } from "./errors";
import { extractFreeIdentifiers, extractMemberReads } from "./analyze";
import { ALLOWED_GLOBALS, GLOBAL_VALUES } from "./globals";
import { HostFn, Lambda, Namespace } from "./membrane";
import { DEFAULT_MAX_SOURCE_LENGTH, parseExpression } from "./parse";
import { validateNode } from "./validate";

// The language machinery is shared; only the back end differs: `interpret/`
// compiles the AST to closures this package runs itself, `native/` validates
// and then runs the source with `new Function`.
export { ExpressionError, type ExpressionErrorReason };
export { ALLOWED_GLOBALS };
export { ALLOWED_NODES, FORBIDDEN_KEYS } from "./grammar";
export { DEFAULT_BUDGET, type BudgetOptions };
export { HostFn, Lambda, Namespace };

/**
 * Two back ends, two threat models. `"interpret"` (default): every read and
 * call checked, no `unsafe-eval` — untrusted documents. `"native"`: same
 * grammar, then `new Function` — trusted authors; run-time-assembled property
 * names go unchecked.
 */
export type EvaluatorMode = "interpret" | "native";

export type EvaluatorOptions = {
	/** Which back end runs the expression. Default `"interpret"`. */
	mode?: EvaluatorMode;
	/** Parsed-expression cache size. Default 500. */
	maxCacheSize?: number;
	/** Longest accepted expression source, in characters. Default 1000. */
	maxSourceLength?: number;
	/** CPU, time, and allocation ceilings. */
	budget?: BudgetOptions;
	/** Extra names, as VALUES. They pass the same membrane, so only plain data is readable. */
	globals?: Record<string, unknown>;
};

export type ExpressionFacts = {
	freeIds: readonly string[];
};

type CacheEntry = ExpressionFacts & {
	source: string;
	ast: acorn.Expression;
	/** Member paths per root, computed on first ask — see {@link Evaluator.memberReads}. */
	reads?: Map<string, readonly string[]>;
	thunk?: Thunk;
	/** Native compilation bakes in parameter names — keyed by which freeIds the caller supplies. */
	native?: { mask: number; key: string; run: CompiledNative };
};

/** JavaScript-shaped expression language: closed grammar, membrane on every read and call, budget. See {@link EvaluatorMode}. */
export class Evaluator {
	#cache = new Map<string, CacheEntry>();
	#maxCacheSize: number;
	#maxSourceLength: number;
	#budgetOptions: BudgetOptions;
	#globals: Record<string, unknown> | undefined;
	#mode: EvaluatorMode;
	/** Boxed host-function records, keyed by record identity. */
	#boxedFns = new WeakMap<
		Record<string, (input: unknown) => unknown>,
		Record<string, HostFn>
	>();
	// One Budget reused across SYNC evaluations — allocating one per eval cost
	// more than a small expression. Async evaluations (and synchronous
	// re-entrancy through a host function) take a fresh instance instead.
	#syncBudget: Budget | null = null;
	#syncBudgetBusy = false;

	constructor(options: EvaluatorOptions = {}) {
		this.#maxCacheSize = options.maxCacheSize ?? 500;
		this.#maxSourceLength = options.maxSourceLength ?? DEFAULT_MAX_SOURCE_LENGTH;
		this.#budgetOptions = options.budget ?? {};
		const globals = options.globals;
		this.#globals = globals && Object.keys(globals).length > 0 ? globals : undefined;
		this.#mode = options.mode ?? "interpret";
	}

	/** Run a prepared expression through whichever back end this evaluator uses. */
	#run(
		entry: CacheEntry,
		context: Record<string, unknown>,
		functions?: Record<string, (input: unknown) => unknown>,
	): unknown {
		if (this.#mode === "native") return this.#runNative(entry, context, functions);

		entry.thunk ??= compileAst(entry.ast);
		const rt: Runtime = {
			budget: this.#takeBudget(),
			context,
			functions: functions ? this.#boxed(functions) : undefined,
			globals: this.#globals,
		};
		if (rt.budget !== this.#syncBudget) return entry.thunk(null, rt);
		this.#syncBudgetBusy = true;
		try {
			return entry.thunk(null, rt);
		} finally {
			this.#syncBudgetBusy = false;
		}
	}

	#takeBudget(): Budget {
		if (this.#syncBudgetBusy) return new Budget(this.#budgetOptions);
		this.#syncBudget ??= new Budget(this.#budgetOptions);
		this.#syncBudget.reset();
		return this.#syncBudget;
	}

	#boxed(
		functions: Record<string, (input: unknown) => unknown>,
	): Record<string, HostFn> {
		let boxed = this.#boxedFns.get(functions);
		if (!boxed) {
			boxed = {};
			for (const [name, fn] of Object.entries(functions)) {
				boxed[name] = new HostFn(name, fn);
			}
			this.#boxedFns.set(functions, boxed);
		}
		return boxed;
	}

	/** Native back end. Parameters = the free identifiers the caller supplies, so the per-eval shape check is a few hasOwn calls. */
	#runNative(
		entry: CacheEntry,
		context: Record<string, unknown>,
		functions?: Record<string, (input: unknown) => unknown>,
	): unknown {
		const globals = this.#globals;
		const freeIds = entry.freeIds;
		// One pass: resolve each free identifier the caller supplies, and record
		// WHICH were supplied as a bitmask — the shape key for the compiled fn.
		// A bitmask only addresses 31 slots; the (practically unreachable) wider
		// case compares exact names instead of risking a positional mismatch.
		let mask = 0;
		const wide = freeIds.length > 31;
		const values: unknown[] = [];
		const names: string[] | null = wide ? [] : null;
		for (let i = 0; i < freeIds.length; i++) {
			const id = freeIds[i];
			if (functions !== undefined && Object.hasOwn(functions, id)) {
				values.push(functions[id]);
			} else if (Object.hasOwn(context, id)) {
				values.push(context[id]);
			} else if (globals !== undefined && Object.hasOwn(globals, id)) {
				values.push(globals[id]);
			} else {
				continue;
			}
			if (names) names.push(id);
			else mask |= 1 << i;
		}
		let native = entry.native;
		const key = names ? names.join("\u0000") : "";
		if (native === undefined || (names ? native.key !== key : native.mask !== mask)) {
			const bound = names ?? freeIds.filter((_, i) => (mask & (1 << i)) !== 0);
			native = entry.native = {
				mask,
				key,
				run: compileNative(entry.source, entry.ast, entry.freeIds, bound),
			};
		}
		return native.run(values);
	}

	#analyze(source: string): CacheEntry {
		const cached = this.#cache.get(source);
		if (cached) return cached;

		const ast = parseExpression(source, this.#maxSourceLength);
		validateNode(ast);

		const entry: CacheEntry = {
			source,
			ast,
			freeIds: Object.freeze(extractFreeIdentifiers(ast)),
		};

		if (this.#cache.size >= this.#maxCacheSize) {
			const oldest = this.#cache.keys().next().value;
			if (oldest !== undefined) this.#cache.delete(oldest);
		}
		this.#cache.set(source, entry);
		return entry;
	}

	/** Parse and check without running. Throws {@link ExpressionError} if invalid. */
	validate(source: string): ExpressionFacts {
		const { freeIds } = this.#analyze(source);
		return { freeIds };
	}

	/** Every `<root>.X.Y` static path the expression reads — hosts derive subscriptions from these. uicast asks for `"scopes"`. */
	memberReads(source: string, root: string): readonly string[] {
		const entry = this.#analyze(source);
		entry.reads ??= new Map();
		let paths = entry.reads.get(root);
		if (paths === undefined) {
			paths = Object.freeze(extractMemberReads(entry.ast, root)) as readonly string[];
			entry.reads.set(root, paths);
		}
		return paths;
	}

	/** Compile once, run many times. */
	compile(source: string): (context?: Record<string, unknown>) => unknown {
		const entry = this.#analyze(source);
		return (context = {}) => this.#run(entry, context);
	}

	/** Compile and run. Name precedence: functions, context, instance globals, built-ins. */
	eval(
		source: string,
		context: Record<string, unknown> = {},
		options: { functions?: Record<string, (input: unknown) => unknown> } = {},
	): unknown {
		const entry = this.#analyze(source);
		return this.#run(entry, context, options.functions);
	}

	clearCache(): void {
		this.#cache.clear();
	}
}

/** The names an expression can use with no context at all. */
export const globalNames = (): readonly string[] => Object.keys(GLOBAL_VALUES);
