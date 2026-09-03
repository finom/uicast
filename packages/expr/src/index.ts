import type * as acorn from "acorn";
import { type BudgetOptions, DEFAULT_MAX_SOURCE_LENGTH } from "./constants/limits";
import type { StandardToolV0 } from "./host/standard-tool";
import { bindTools } from "./host/tool";
import { compileAst, type Runtime, type Thunk } from "./interpret/compile";
import { Budget, resolveLimits } from "./runtime/budget";
import { assertData } from "./runtime/membrane";
import type { HostFunction } from "./runtime/values";
import { extractMemberReads } from "./syntax/analyze";
import { parseExpression } from "./syntax/parse";
import { validateFreeIdentifiers, validateNode } from "./syntax/validate";

export type { BudgetOptions };
export { ExpressionError, type ExpressionErrorReason } from "./errors";
export type { StandardJSONSchemaV1, StandardSchemaV1, StandardToolV0, StandardTypedV1 } from "./host/standard-tool";

// Named values an expression can read. Later contexts win over earlier ones.
export type EvaluatorContexts = Record<string, unknown>[];

export type EvaluatorOptions = {
	// Host functions, callable by name. Fixed for the evaluator's lifetime — the parse cache depends on it. A name that shadows a built-in global replaces it.
	functions?: readonly StandardToolV0[];
	// Parsed-expression cache size. Default 500.
	maxCacheSize?: number;
	// Longest accepted expression source, in characters. Default 1000.
	maxSourceLength?: number;
	// CPU, time, and allocation ceilings.
	budget?: BudgetOptions;
};

export type ExpressionFacts = {
	freeIds: readonly string[];
	// Host functions this expression calls.
	toolCalls: readonly string[];
};

// What both evaluators share and uicast types against. Implement it to plug in your own — for any language.
export interface ExpressionEvaluator {
	readonly functions: readonly StandardToolV0[];
	validate(source: string): ExpressionFacts;
	memberReads(source: string, root: string): readonly string[];
	compile<TOut = unknown, TIn extends EvaluatorContexts = EvaluatorContexts>(source: string): (...contexts: TIn) => TOut;
	eval<TOut = unknown, TIn extends EvaluatorContexts = EvaluatorContexts>(source: string, ...contexts: TIn): TOut;
}

// One parsed source: the static facts, the closure tree once compiled, and the member reads once asked.
type Entry = ExpressionFacts & {
	ast: acorn.Expression;
	reads?: Map<string, readonly string[]>;
	compiled?: Thunk;
};

// The language, interpreted: every read and call checked as it happens, under a budget. Source never reaches the JavaScript engine, so no CSP `unsafe-eval`.
export class Evaluator implements ExpressionEvaluator {
	// The host functions bound at construction, as given.
	readonly functions: readonly StandardToolV0[];
	#tools: Record<string, HostFunction>;
	// Keyed by source alone, which is only sound because the host functions are fixed at construction — the host-call verdict is per (source, tools).
	#cache = new Map<string, Entry>();
	#maxCacheSize: number;
	#maxSourceLength: number;
	#limits: Required<BudgetOptions>;

	constructor(options: EvaluatorOptions = {}) {
		this.functions = options.functions ?? [];
		this.#tools = bindTools(this.functions);
		this.#maxCacheSize = options.maxCacheSize ?? 500;
		this.#maxSourceLength = options.maxSourceLength ?? DEFAULT_MAX_SOURCE_LENGTH;
		this.#limits = resolveLimits(options.budget);
	}

	// Parse and check without running. Throws ExpressionError if invalid.
	validate(source: string): ExpressionFacts {
		const { freeIds, toolCalls } = this.#analyze(source);
		return { freeIds, toolCalls };
	}

	// Every `<root>.X.Y` static path the expression reads — hosts derive subscriptions from these. uicast asks for `"scopes"`.
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

	// Compile once, run many times. `TOut` asserts the result type (nothing checks it); `TIn` types the contexts, e.g. `compile<string, [{ cents: number }]>(…)`.
	compile<TOut = unknown, TIn extends EvaluatorContexts = EvaluatorContexts>(source: string): (...contexts: TIn) => TOut {
		const entry = this.#analyze(source);
		return (...contexts: TIn) => this.#run(entry, contexts) as TOut;
	}

	// Compile and run. Names resolve to host functions first, then the contexts last-to-first, then built-in globals. `TOut` asserts the result type (nothing checks it); `TIn` types the contexts.
	eval<TOut = unknown, TIn extends EvaluatorContexts = EvaluatorContexts>(source: string, ...contexts: TIn): TOut {
		const entry = this.#analyze(source);
		return this.#run(entry, contexts) as TOut;
	}

	#analyze(source: string): Entry {
		const cached = this.#cache.get(source);
		if (cached) return cached;

		const ast = parseExpression(source, this.#maxSourceLength);
		validateNode(ast);
		const tools = this.#tools;
		const freeIds = validateFreeIdentifiers(ast, (name) => tools[name] !== undefined);
		const entry: Entry = {
			ast,
			freeIds: Object.freeze(freeIds),
			toolCalls: Object.freeze(freeIds.filter((id) => tools[id] !== undefined)),
		};

		if (this.#cache.size >= this.#maxCacheSize) {
			const oldest = this.#cache.keys().next().value;
			if (oldest !== undefined) this.#cache.delete(oldest);
		}
		this.#cache.set(source, entry);
		return entry;
	}

	#run(entry: Entry, contexts: EvaluatorContexts): unknown {
		entry.compiled ??= compileAst(entry.ast, this.#tools);
		const rt: Runtime = { budget: new Budget(this.#limits), contexts };
		const value = entry.compiled(null, rt);
		// The exit gate: nothing but plain data leaves — a live value copied past the per-read gate stops here. Most results are primitives; only an object needs the walk.
		if (typeof value === "object" || typeof value === "function") assertData(value, "The result");
		return value;
	}
}
