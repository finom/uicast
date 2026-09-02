import type * as acorn from "acorn";
import {
	type EvaluatorContexts,
	type ExpressionEvaluator,
	type ExpressionFacts,
	ExpressionError,
	type StandardToolV0,
} from "@uicast/expr";
import {
	assertData,
	bindTools,
	DEFAULT_MAX_SOURCE_LENGTH,
	extractMemberReads,
	type HostFunction,
	parseExpression,
	validateFreeIdentifiers,
	validateNode,
} from "@uicast/expr/internal";
import { canBind, compile, type Compiled } from "./compile";
import { PLATFORM_GLOBALS } from "./platform-globals";

export type PassthroughEvaluatorOptions = {
	// Host functions, callable by name. Fixed for the evaluator's lifetime — the parse cache depends on it. A name that shadows a built-in global replaces it.
	functions?: readonly StandardToolV0[];
	// Parsed-expression cache size. Default 500.
	maxCacheSize?: number;
	// Longest accepted expression source, in characters. Default 1000.
	maxSourceLength?: number;
};

// One parsed source: the static facts, the binding order, and the compiled function once made.
type Entry = ExpressionFacts & {
	source: string;
	ast: acorn.Expression;
	// Free ids a context must supply, in freeIds order.
	contextIds: readonly string[];
	reads?: Map<string, readonly string[]>;
	compiled?: Compiled;
};

// The contexts, last one first, then the platform globals.
const lookup = (name: string, contexts: EvaluatorContexts): unknown => {
	for (let i = contexts.length - 1; i >= 0; i--) {
		if (Object.hasOwn(contexts[i], name)) return contexts[i][name];
	}
	if (Object.hasOwn(PLATFORM_GLOBALS, name)) return PLATFORM_GLOBALS[name];
	throw new ExpressionError(`"${name}" is not available in expressions`, "unknown-reference");
};

// The same language, checked by @uicast/expr's static passes, then handed to the engine through `new Function`. No membrane, no budget, needs `unsafe-eval` — for expressions from an author you trust. Same methods as `Evaluator`.
export class PassthroughEvaluator implements ExpressionEvaluator {
	// The host functions bound at construction, as given.
	readonly functions: readonly StandardToolV0[];
	#tools: Record<string, HostFunction>;
	// Keyed by source alone — sound because the host functions are fixed at construction.
	#cache = new Map<string, Entry>();
	#maxCacheSize: number;
	#maxSourceLength: number;

	constructor(options: PassthroughEvaluatorOptions = {}) {
		if ("budget" in options) {
			throw new ExpressionError("PassthroughEvaluator has no budget — nothing meters the engine. Use Evaluator for that", "host-function");
		}
		this.functions = options.functions ?? [];
		this.#tools = bindTools(this.functions);
		this.#maxCacheSize = options.maxCacheSize ?? 500;
		this.#maxSourceLength = options.maxSourceLength ?? DEFAULT_MAX_SOURCE_LENGTH;
		for (const { name } of this.functions) {
			if (!canBind(name)) {
				throw new ExpressionError(`Host function name "${name}" cannot be a parameter name in strict mode`, "host-function");
			}
		}
	}

	// Parse and check without running. Throws ExpressionError if invalid.
	validate(source: string): ExpressionFacts {
		const { freeIds, toolCalls } = this.#analyze(source);
		return { freeIds, toolCalls };
	}

	// Every `<root>.X.Y` static path the expression reads.
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

	// Compile once, run many times. `TOut` asserts the result type (nothing checks it); `TIn` types the contexts.
	compile<TOut = unknown, TIn extends EvaluatorContexts = EvaluatorContexts>(source: string): (...contexts: TIn) => TOut {
		const entry = this.#analyze(source);
		return (...contexts: TIn) => this.#run(entry, contexts) as TOut;
	}

	// Compile and run. Names resolve to host functions first, then the contexts last-to-first, then the platform globals.
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
			source,
			ast,
			freeIds: Object.freeze(freeIds),
			toolCalls: Object.freeze(freeIds.filter((id) => tools[id] !== undefined)),
			contextIds: Object.freeze(freeIds.filter((id) => tools[id] === undefined)),
		};

		if (this.#cache.size >= this.#maxCacheSize) {
			const oldest = this.#cache.keys().next().value;
			if (oldest !== undefined) this.#cache.delete(oldest);
		}
		this.#cache.set(source, entry);
		return entry;
	}

	#run(entry: Entry, contexts: EvaluatorContexts): unknown {
		// Positional: the tools, then the context ids — the order compile() binds.
		entry.compiled ??= compile(entry.source, entry.ast, [...entry.toolCalls, ...entry.contextIds]);
		const values: unknown[] = entry.toolCalls.map((name) => this.#tools[name]);
		for (const name of entry.contextIds) values.push(lookup(name, contexts));
		let value: unknown;
		try {
			value = entry.compiled(...values);
		} catch (err) {
			if (ExpressionError.is(err)) throw err;
			throw new ExpressionError(err instanceof Error ? err.message : String(err), "runtime", err);
		}
		// The exit gate, same as the interpreter's: nothing but plain data leaves.
		if (typeof value === "object" || typeof value === "function") assertData(value, "The result");
		return value;
	}
}
