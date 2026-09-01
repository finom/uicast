import type * as acorn from "acorn";
import type { StandardToolV0 } from "standard-tool";
import { Budget, DEFAULT_BUDGET, type BudgetOptions } from "./budget";
import { compileAst, type Runtime, type Thunk } from "./interpret/compile";
import { compileNative, type CompiledNative } from "./native/compile";
import { ExpressionError, type ExpressionErrorReason } from "./errors";
import { extractMemberReads } from "./analyze";
import { ALLOWED_GLOBALS, NATIVE_GLOBAL_VALUES } from "./globals";
import type { HostFn } from "./membrane";
import { bindTools } from "./tool";
import { DEFAULT_MAX_SOURCE_LENGTH, parseExpression } from "./parse";
import { validateFreeIdentifiers, validateNode } from "./validate";

// The language machinery is shared; only the back end differs: `interpret/`
// compiles the AST to closures this package runs itself, `native/` validates
// and then runs the source with `new Function`.
export { ExpressionError, type ExpressionErrorReason };
export { ALLOWED_GLOBALS };
export { DEFAULT_BUDGET, type BudgetOptions };

/**
 * Two back ends, two threat models. `"interpret"` (default): every read and
 * call checked, no `unsafe-eval` — untrusted documents. `"native"`: same
 * grammar, then `new Function` — trusted authors; run-time-assembled property
 * names go unchecked.
 */
export type EvaluatorMode = "interpret" | "native";

/** Named values an expression can read. Later contexts win over earlier ones. */
export type EvaluatorContexts = Record<string, unknown>[];

export type EvaluatorOptions = {
	/** Which back end runs the expression. Default `"interpret"`. */
	mode?: EvaluatorMode;
	/**
	 * Host functions, callable by name. Fixed for this evaluator's lifetime —
	 * the parse cache and the host-call check both depend on that. A name must be
	 * a usable identifier and unique; a name that shadows a built-in global makes
	 * that global unreachable, since the name is then a host function everywhere.
	 */
	functions?: readonly StandardToolV0[];
	/** Parsed-expression cache size. Default 500. */
	maxCacheSize?: number;
	/** Longest accepted expression source, in characters. Default 1000. */
	maxSourceLength?: number;
	/** CPU, time, and allocation ceilings. */
	budget?: BudgetOptions;
};

export type ExpressionFacts = {
	freeIds: readonly string[];
	/** Host functions this expression calls. */
	toolCalls: readonly string[];
};

type CacheEntry = ExpressionFacts & {
	source: string;
	ast: acorn.Expression;
	/** Member paths per root, computed on first ask — see {@link Evaluator.memberReads}. */
	reads?: Map<string, readonly string[]>;
	thunk?: Thunk;
	/** Free ids a context must supply, in freeIds order. */
	contextIds: readonly string[];
	/** Native's parameter list: tools first, then context ids. Constant per source. */
	bindings: readonly string[];
	native?: CompiledNative;
};

const NOT_A_TOOL = () => false;

/** JavaScript-shaped expression language: closed grammar, membrane on every read and call, budget. See {@link EvaluatorMode}. */
export class Evaluator {
	// Keyed by source alone, which is only sound because the host functions are
	// fixed at construction — the host-call check's verdict is per (source, tools).
	#cache = new Map<string, CacheEntry>();
	#maxCacheSize: number;
	#maxSourceLength: number;
	#budgetOptions: BudgetOptions;
	#mode: EvaluatorMode;
	#tools: Record<string, HostFn>;
	#hasTools: boolean;
	// One Budget reused across SYNC evaluations — allocating one per eval cost
	// more than a small expression. Async evaluations (and synchronous
	// re-entrancy through a host function) take a fresh instance instead.
	#syncBudget: Budget | null = null;
	#syncBudgetBusy = false;

	constructor(options: EvaluatorOptions = {}) {
		this.#maxCacheSize = options.maxCacheSize ?? 500;
		this.#maxSourceLength = options.maxSourceLength ?? DEFAULT_MAX_SOURCE_LENGTH;
		this.#budgetOptions = options.budget ?? {};
		this.#mode = options.mode ?? "interpret";
		const tools = options.functions;
		this.#tools = bindTools(tools ?? []);
		this.#hasTools = tools !== undefined && tools.length > 0;
	}

	/** Run a prepared expression through whichever back end this evaluator uses. */
	#run(entry: CacheEntry, contexts: EvaluatorContexts): unknown {
		if (this.#mode === "native") return this.#runNative(entry, contexts);

		entry.thunk ??= compileAst(entry.ast);
		const rt: Runtime = { budget: this.#takeBudget(), contexts, tools: this.#tools };
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

	/** Native back end. Every free id is statically a tool or a context name, so the parameter list is constant per source — compiled once. */
	#runNative(entry: CacheEntry, contexts: EvaluatorContexts): unknown {
		const { toolCalls, contextIds } = entry;
		const values: unknown[] = [];
		for (let i = 0; i < toolCalls.length; i++) values.push(this.#tools[toolCalls[i]].fn);
		outer: for (let i = 0; i < contextIds.length; i++) {
			const id = contextIds[i];
			for (let c = contexts.length - 1; c >= 0; c--) {
				if (Object.hasOwn(contexts[c], id)) {
					values.push(contexts[c][id]);
					continue outer;
				}
			}
			// hasOwn, not a truthy check — `undefined` and `NaN` are members.
			if (Object.hasOwn(NATIVE_GLOBAL_VALUES, id)) {
				values.push(NATIVE_GLOBAL_VALUES[id]);
				continue;
			}
			throw new ExpressionError(`"${id}" is not available in expressions`, "unknown-reference");
		}
		entry.native ??= compileNative(entry.source, entry.ast, entry.bindings);
		return entry.native(values);
	}

	#analyze(source: string): CacheEntry {
		const cached = this.#cache.get(source);
		if (cached) return cached;

		const ast = parseExpression(source, this.#maxSourceLength);
		validateNode(ast);
		const tools = this.#tools;
		const freeIds = validateFreeIdentifiers(
			ast,
			this.#hasTools ? (name) => tools[name] !== undefined : NOT_A_TOOL,
		);
		const toolCalls: string[] = [];
		const contextIds: string[] = [];
		for (const id of freeIds) (tools[id] !== undefined ? toolCalls : contextIds).push(id);

		const entry: CacheEntry = {
			source,
			ast,
			freeIds: Object.freeze(freeIds),
			toolCalls: Object.freeze(toolCalls),
			contextIds: Object.freeze(contextIds),
			bindings: Object.freeze([...toolCalls, ...contextIds]),
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
		const { freeIds, toolCalls } = this.#analyze(source);
		return { freeIds, toolCalls };
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

	/** Compile once, run many times. `TOut` is an assertion about the result, not a check on it. */
	compile<TOut = unknown, TIn extends EvaluatorContexts = EvaluatorContexts>(
		source: string,
	): (...contexts: TIn) => TOut {
		const entry = this.#analyze(source);
		return (...contexts: TIn) => this.#run(entry, contexts) as TOut;
	}

	/** Compile and run. Names resolve to host functions first, then the contexts last-to-first, then built-in globals. `TOut` is an assertion about the result, not a check on it. */
	eval<TOut = unknown, TIn extends EvaluatorContexts = EvaluatorContexts>(
		source: string,
		...contexts: TIn
	): TOut {
		const entry = this.#analyze(source);
		return this.#run(entry, contexts) as TOut;
	}
}
