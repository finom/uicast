import {
	type EvaluatorContexts,
	type ExpressionEvaluator,
	type ExpressionFacts,
	ExpressionError,
	type StandardToolV0,
} from "@uicast/expr";
import {
	type Analysis,
	Analyzer,
	assertData,
	bindTools,
	DEFAULT_MAX_CACHE_SIZE,
	DEFAULT_MAX_SOURCE_LENGTH,
	type HostFunction,
} from "@uicast/expr/internal";
import { canBind, compile, type Compiled } from "./compile";

export type PassthroughEvaluatorOptions = {
	// Fixed for the evaluator's lifetime: the parse cache depends on it. A name that shadows a global replaces it.
	functions?: readonly StandardToolV0[];
	// Parsed-expression cache size. Default 500.
	maxCacheSize?: number;
	// Longest accepted expression source, in characters. Default 1000.
	maxSourceLength?: number;
};

// No membrane, no budget, needs `unsafe-eval`: for expressions from an author you trust.
export class PassthroughEvaluator implements ExpressionEvaluator {
	readonly functions: readonly StandardToolV0[];
	readonly #tools: Record<string, HostFunction>;
	readonly #analyzer: Analyzer<Compiled>;

	constructor(options: PassthroughEvaluatorOptions = {}) {
		if ("budget" in options) {
			throw new ExpressionError("PassthroughEvaluator has no budget — nothing meters the engine. Use Evaluator for that", "host-function");
		}
		this.functions = options.functions ?? [];
		this.#tools = bindTools(this.functions);
		this.#analyzer = new Analyzer({
			tools: this.#tools,
			maxCacheSize: options.maxCacheSize ?? DEFAULT_MAX_CACHE_SIZE,
			maxSourceLength: options.maxSourceLength ?? DEFAULT_MAX_SOURCE_LENGTH,
		});
		for (const { name } of this.functions) {
			if (!canBind(name)) {
				throw new ExpressionError(`Host function name "${name}" cannot be a parameter name in strict mode`, "host-function");
			}
		}
	}

	// Throws ExpressionError if invalid. Compiles too: the prototype-name check and the engine's own parse run there.
	validate(source: string): ExpressionFacts {
		const entry = this.#analyzer.analyze(source);
		entry.compiled ??= compile(entry, this.#tools);
		return { freeIds: entry.freeIds, toolCalls: entry.toolCalls };
	}

	memberReads(source: string, root: string): readonly string[] {
		return this.#analyzer.memberReads(source, root);
	}

	// `TOut` asserts the result type (nothing checks it).
	compile<TOut = unknown, TIn extends EvaluatorContexts = EvaluatorContexts>(source: string): (...contexts: TIn) => TOut {
		const entry = this.#analyzer.analyze(source);
		return (...contexts: TIn) => this.#run(entry, contexts) as TOut;
	}

	// Names resolve to host functions first, then the contexts last-to-first, then the platform globals.
	eval<TOut = unknown, TIn extends EvaluatorContexts = EvaluatorContexts>(source: string, ...contexts: TIn): TOut {
		return this.#run(this.#analyzer.analyze(source), contexts) as TOut;
	}

	#run(entry: Analysis<Compiled>, contexts: EvaluatorContexts): unknown {
		entry.compiled ??= compile(entry, this.#tools);
		let value: unknown;
		try {
			value = entry.compiled(contexts);
		} catch (err) {
			if (ExpressionError.is(err)) throw err;
			throw new ExpressionError(err instanceof Error ? err.message : String(err), "expression-runtime", err);
		}
		// The exit gate: nothing but plain data leaves.
		if (typeof value === "object" || typeof value === "function") assertData(value, "The result", true);
		return value;
	}
}
