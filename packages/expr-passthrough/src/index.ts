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
	DEFAULT_MAX_SOURCE_LENGTH,
	type HostFunction,
} from "@uicast/expr/internal";
import { canBind, compile, type Compiled } from "./compile";

export type PassthroughEvaluatorOptions = {
	// Host functions, callable by name. Fixed for the evaluator's lifetime — the parse cache depends on it.
	// A name that shadows a built-in global replaces it.
	functions?: readonly StandardToolV0[];
	// Parsed-expression cache size. Default 500.
	maxCacheSize?: number;
	// Longest accepted expression source, in characters. Default 1000.
	maxSourceLength?: number;
};

// The same language, checked by @uicast/expr's static passes, then handed to the engine through `new Function`.
// No membrane, no budget, needs `unsafe-eval` — for expressions from an author you trust. Same methods as `Evaluator`.
export class PassthroughEvaluator implements ExpressionEvaluator {
	// The host functions bound at construction, as given.
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
			maxCacheSize: options.maxCacheSize ?? 500,
			maxSourceLength: options.maxSourceLength ?? DEFAULT_MAX_SOURCE_LENGTH,
		});
		for (const { name } of this.functions) {
			if (!canBind(name)) {
				throw new ExpressionError(`Host function name "${name}" cannot be a parameter name in strict mode`, "host-function");
			}
		}
	}

	// Parse and check without running. Throws ExpressionError if invalid.
	validate(source: string): ExpressionFacts {
		const { freeIds, toolCalls } = this.#analyzer.analyze(source);
		return { freeIds, toolCalls };
	}

	// Every `<root>.X.Y` static path the expression reads.
	memberReads(source: string, root: string): readonly string[] {
		return this.#analyzer.memberReads(source, root);
	}

	// Compile once, run many times. `TOut` asserts the result type (nothing checks it); `TIn` types the contexts.
	compile<TOut = unknown, TIn extends EvaluatorContexts = EvaluatorContexts>(source: string): (...contexts: TIn) => TOut {
		const entry = this.#analyzer.analyze(source);
		return (...contexts: TIn) => this.#run(entry, contexts) as TOut;
	}

	// Compile and run. Names resolve to host functions first, then the contexts last-to-first, then the platform globals.
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
			throw new ExpressionError(err instanceof Error ? err.message : String(err), "runtime", err);
		}
		// The exit gate, same as the interpreter's: nothing but plain data leaves.
		if (typeof value === "object" || typeof value === "function") assertData(value, "The result");
		return value;
	}
}
