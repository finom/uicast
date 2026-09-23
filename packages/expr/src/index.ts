import { type BudgetOptions, DEFAULT_MAX_CACHE_SIZE, DEFAULT_MAX_SOURCE_LENGTH } from "./constants/limits";
import { ExpressionError } from "./errors";
import type { StandardToolV0 } from "./host/standard-tool";
import { bindTools } from "./host/tool";
import { compileAst, type Runtime, type Thunk } from "./interpret/compile";
import { Budget, resolveLimits } from "./runtime/budget";
import { assertData } from "./runtime/membrane";
import type { HostFunction } from "./runtime/values";
import { type Analysis, Analyzer, type ExpressionFacts } from "./syntax/analyzer";

export type { BudgetOptions, ExpressionFacts };
export { ExpressionError, type ExpressionErrorReason } from "./errors";
export type { StandardJSONSchemaV1, StandardSchemaV1, StandardToolV0 } from "./host/standard-tool";

// Named values an expression can read. Later contexts win over earlier ones.
export type EvaluatorContexts = Record<string, unknown>[];

export type EvaluatorOptions = {
	// Fixed for the evaluator's lifetime: the parse cache depends on it. A name that shadows a global replaces it.
	functions?: readonly StandardToolV0[];
	// Parsed-expression cache size. Default 500.
	maxCacheSize?: number;
	// Longest accepted expression source, in characters. Default 1000.
	maxSourceLength?: number;
	budget?: BudgetOptions;
};

// Implement it to plug in another evaluator.
export interface ExpressionEvaluator {
	readonly functions: readonly StandardToolV0[];
	validate(source: string): ExpressionFacts;
	memberReads(source: string, root: string): readonly string[];
	compile<TOut = unknown, TIn extends EvaluatorContexts = EvaluatorContexts>(source: string): (...contexts: TIn) => TOut;
	eval<TOut = unknown, TIn extends EvaluatorContexts = EvaluatorContexts>(source: string, ...contexts: TIn): TOut;
}

// Source never reaches the JavaScript engine, so no CSP `unsafe-eval`.
export class Evaluator implements ExpressionEvaluator {
	readonly functions: readonly StandardToolV0[];
	readonly #tools: Record<string, HostFunction>;
	readonly #analyzer: Analyzer<Thunk>;
	readonly #limits: Required<BudgetOptions>;

	constructor(options: EvaluatorOptions = {}) {
		this.functions = options.functions ?? [];
		this.#tools = bindTools(this.functions);
		this.#analyzer = new Analyzer({
			tools: this.#tools,
			maxCacheSize: options.maxCacheSize ?? DEFAULT_MAX_CACHE_SIZE,
			maxSourceLength: options.maxSourceLength ?? DEFAULT_MAX_SOURCE_LENGTH,
		});
		this.#limits = resolveLimits(options.budget);
	}

	// Throws ExpressionError if invalid.
	validate(source: string): ExpressionFacts {
		const { freeIds, toolCalls } = this.#analyzer.analyze(source);
		return { freeIds, toolCalls };
	}

	// uicast asks for `"scopes"`.
	memberReads(source: string, root: string): readonly string[] {
		return this.#analyzer.memberReads(source, root);
	}

	// `TOut` asserts the result type (nothing checks it).
	compile<TOut = unknown, TIn extends EvaluatorContexts = EvaluatorContexts>(source: string): (...contexts: TIn) => TOut {
		const entry = this.#analyzer.analyze(source);
		return (...contexts: TIn) => this.#run(entry, contexts) as TOut;
	}

	// Names resolve to host functions first, then the contexts last-to-first, then built-in globals.
	eval<TOut = unknown, TIn extends EvaluatorContexts = EvaluatorContexts>(source: string, ...contexts: TIn): TOut {
		return this.#run(this.#analyzer.analyze(source), contexts) as TOut;
	}

	#run(entry: Analysis<Thunk>, contexts: EvaluatorContexts): unknown {
		entry.compiled ??= compileAst(entry.ast, this.#tools);
		const rt: Runtime = { budget: new Budget(this.#limits), contexts };
		let value: unknown;
		try {
			value = entry.compiled(null, rt);
		} catch (err) {
			// An operator's native coercion can throw a raw TypeError.
			if (ExpressionError.is(err)) throw err;
			throw new ExpressionError(err instanceof Error ? err.message : String(err), "expression-runtime", err);
		}
		// The exit gate: nothing but plain data leaves. Most results are primitives, so only an object is walked.
		if (typeof value === "object" || typeof value === "function") assertData(value, "The result", true);
		return value;
	}
}
