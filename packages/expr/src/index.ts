import { type BudgetOptions, DEFAULT_MAX_CACHE_SIZE, DEFAULT_MAX_SOURCE_LENGTH } from "./constants/limits";
import { ExpressionError } from "./errors";
import type { StandardToolV0 } from "./host/standard-tool";
import { bindTools, callTool } from "./host/tool";
import { compileAst } from "./interpret/compile";
import { Budget, resolveLimits } from "./runtime/budget";
import { GLOBAL_VALUES, PLATFORM_GLOBALS } from "./runtime/globals";
import { lookupName, unknownName } from "./runtime/lookup";
import { assertData } from "./runtime/membrane";
import type { HostFunction } from "./runtime/values";
import { type Analysis, Analyzer, type ExpressionFacts } from "./syntax/analyzer";
import { validateExpression } from "./syntax/validate";

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

type Run = (contexts: EvaluatorContexts) => unknown;

const messageOf = (err: unknown): string => (err instanceof Error ? err.message : String(err));

// Source never reaches the JavaScript engine unless a subclass sets `toFunction`, so no CSP `unsafe-eval`.
// Each protected method is one step a subclass can change or skip.
export class Evaluator implements ExpressionEvaluator {
	readonly functions: readonly StandardToolV0[];
	readonly #hostFunctions: Record<string, HostFunction>;
	readonly #analyzer: Analyzer<Run>;
	readonly #limits: Required<BudgetOptions>;
	readonly #isHostFunction = (name: string): boolean => this.#hostFunctions[name] !== undefined;
	readonly #global = (name: string): unknown => this.resolveGlobal(name);

	constructor(options: EvaluatorOptions = {}) {
		this.functions = options.functions ?? [];
		this.#hostFunctions = bindTools(this.functions, (fn, input) => this.callHostFunction(fn, input));
		this.#analyzer = new Analyzer({
			isTool: this.#isHostFunction,
			check: (source) => this.check(source),
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

	// Names resolve to host functions first, then the contexts last to first, then `resolveGlobal`.
	eval<TOut = unknown, TIn extends EvaluatorContexts = EvaluatorContexts>(source: string, ...contexts: TIn): TOut {
		return this.#run(this.#analyzer.analyze(source), contexts) as TOut;
	}

	// The language rules, run once per source. Throw an ExpressionError to refuse it.
	protected check(source: string): void {
		validateExpression(this.#analyzer.parse(source), this.#isHostFunction);
	}

	// A name no context and no host function has: one of the language's globals, or an unknown-reference error.
	protected resolveGlobal(name: string): unknown {
		const globals = this.toFunction ? PLATFORM_GLOBALS : GLOBAL_VALUES;
		return Object.hasOwn(globals, name) ? globals[name] : unknownName(name);
	}

	// One host-function call: the data gate and the tool's own schemas on both sides of `execute`.
	protected callHostFunction(fn: StandardToolV0, input: unknown): unknown {
		return callTool(fn, input);
	}

	// The exit gate: only plain data leaves, and a promise only as the whole result.
	protected checkResult(value: unknown): void {
		// Most results are primitives, so only an object is walked.
		if (typeof value === "object" || typeof value === "function") assertData(value, "The result", true);
	}

	// Set it to run expressions as JavaScript: called once per expression with what `new Function` takes,
	// and returns what it returns. Nothing meters that function, so `budget` does not apply.
	// biome-ignore lint/complexity/noBannedTypes: what `new Function` returns
	protected toFunction?(names: readonly string[], body: string): Function;

	#run(entry: Analysis<Run>, contexts: EvaluatorContexts): unknown {
		entry.compiled ??= this.#compile(entry);
		let value: unknown;
		try {
			value = entry.compiled(contexts);
		} catch (err) {
			// An operator's native coercion can throw a raw TypeError.
			if (ExpressionError.is(err)) throw err;
			throw new ExpressionError(messageOf(err), "expression-runtime", err);
		}
		this.checkResult(value);
		return value;
	}

	#compile({ source, ast, freeIds }: Analysis<Run>): Run {
		const hostFunctions = this.#hostFunctions;
		const global = this.#global;
		if (this.toFunction === undefined) {
			const run = compileAst(ast, hostFunctions);
			const limits = this.#limits;
			return (contexts) => run(null, { budget: new Budget(limits), contexts, global });
		}
		// A factory: the source runs in `inner`, one parameter per free name, and the function it returns
		// fills them in one fixed-arity call, so binding allocates nothing per evaluation.
		const args = freeIds.map((name, i) => (hostFunctions[name] ? `hosts[${i}]` : `lookup(${JSON.stringify(name)}, contexts)`));
		const body = `"use strict";
const inner = function (${freeIds.join(", ")}) { return (${source}\n); };
return function (contexts) { return inner(${args.join(", ")}); };`;
		const hosts = freeIds.map((name) => hostFunctions[name]);
		const lookup = (name: string, contexts: EvaluatorContexts) => lookupName(name, contexts, global);
		try {
			return this.toFunction(["hosts", "lookup"], body)(hosts, lookup);
		} catch (err) {
			if (ExpressionError.is(err)) throw err;
			throw new ExpressionError(`Failed to compile expression: ${messageOf(err)}. Expression: ${source}`, "expression-syntax", err);
		}
	}
}
