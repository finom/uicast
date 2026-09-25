import { type BudgetOptions, DEFAULT_MAX_CACHE_SIZE, DEFAULT_MAX_SOURCE_LENGTH } from "./constants/limits";
import { ExpressionError, messageOf } from "./errors";
import type { StandardToolV0 } from "./host/standard-tool";
import { bindTools, callTool } from "./host/tool";
import { compileAst } from "./interpret/compile";
import { Budget, resolveLimits } from "./runtime/budget";
import { GLOBAL_VALUES, lookupName, PLATFORM_GLOBALS, unknownName } from "./runtime/globals";
import { assertData } from "./runtime/membrane";
import type { HostFunction } from "./runtime/values";
import { type Analysis, Analyzer, type ExpressionFacts } from "./syntax/analyzer";
import { validateExpression } from "./syntax/validate";

export type { BudgetOptions, ExpressionFacts };
export { ExpressionError, type ExpressionErrorReason } from "./errors";
export type { StandardJSONSchemaV1, StandardSchemaV1, StandardToolV0 } from "./host/standard-tool";

/**
 * The objects of named values an expression reads. Later contexts win over earlier ones.
 *
 * @example
 * evaluator.eval("user.name", { user: guest }, { user: me }); // me.name
 */
export type EvaluatorContexts = Record<string, unknown>[];

/**
 * Options for `new Evaluator()`.
 *
 * @example
 * new Evaluator({ functions: tools, maxSourceLength: 1000, budget: { steps: 200_000 } });
 */
export type EvaluatorOptions = {
  /** Host functions, fixed for the evaluator's lifetime. A name that shadows a global replaces it; a duplicate throws. */
  functions?: readonly StandardToolV0[];
  /** How many parsed expressions to keep. Default 500. */
  maxCacheSize?: number;
  /** Longest accepted expression, in characters; a longer one is refused before parsing. Default 1000. */
  maxSourceLength?: number;
  /** Per-evaluation limits on steps, time and allocation, e.g. `{ steps: 200_000 }`. */
  budget?: BudgetOptions;
};

/**
 * The interface `Evaluator` implements, and the type the renderer's `evaluator` prop takes. Implement it to plug in
 * an evaluator for another expression language.
 *
 * @example
 * const evaluator: ExpressionEvaluator = new Evaluator({ functions: tools });
 * <RendererProvider implementations={impls} evaluator={evaluator}>{children}</RendererProvider>;
 */
export interface ExpressionEvaluator {
  /** The host functions an expression may call. */
  readonly functions: readonly StandardToolV0[];
  /** Checks a source without running it and reports its free names; throws on a refused source. */
  validate(source: string): ExpressionFacts;
  /** The static paths under `root` a source reads, e.g. `["scopes.root.rows"]` for root `"scopes"`. */
  memberReads(source: string, root: string): readonly string[];
  /** Checks a source once and returns a function that runs it against contexts. */
  compile<TOut = unknown, TIn extends EvaluatorContexts = EvaluatorContexts>(
    source: string,
  ): (...contexts: TIn) => TOut;
  /** Runs a source against contexts and returns its value. */
  eval<TOut = unknown, TIn extends EvaluatorContexts = EvaluatorContexts>(source: string, ...contexts: TIn): TOut;
}

type Run = (contexts: EvaluatorContexts) => unknown;

/**
 * Runs expressions in its own interpreter, checking every read and call under a budget. No source reaches the
 * JavaScript engine unless a subclass sets `toFunction`, so no CSP `unsafe-eval`; an expression still reaches every
 * context value and host function you pass. Reuse one instance: it holds the parse cache. Each protected method is
 * one step a subclass can change or skip.
 *
 * @example
 * const evaluator = new Evaluator({ functions: tools, budget: { steps: 200_000 } });
 * evaluator.eval("rows.filter(r => r.stock > 0).length", { rows }); // 2
 */
export class Evaluator implements ExpressionEvaluator {
  /** The host functions bound at construction. */
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

  /**
   * Parses and checks a source without running it. Throws an `ExpressionError` when the language refuses it.
   *
   * @example
   * evaluator.validate("getUser({ id: scopes.root.userId })");
   * // { freeIds: ["getUser", "scopes"], toolCalls: ["getUser"] }
   */
  validate(source: string): ExpressionFacts {
    const { freeIds, toolCalls } = this.#analyzer.analyze(source);
    return { freeIds, toolCalls };
  }

  /**
   * Every static path under `root` the source reads, enough to drive subscriptions. A method call ends a path.
   *
   * @example
   * evaluator.memberReads("scopes.root.rows.filter(r => r.qty > scopes.root.min)", "scopes");
   * // ["scopes.root.rows", "scopes.root.min"]
   */
  memberReads(source: string, root: string): readonly string[] {
    return this.#analyzer.memberReads(source, root);
  }

  /**
   * Checks a source once and returns a function that runs it against contexts. `TOut` asserts the result type;
   * nothing checks it.
   *
   * @example
   * const price = evaluator.compile<string, [{ cents: number }]>("'$' + (cents / 100).toFixed(2)");
   * price({ cents: 1999 }); // "$19.99"
   */
  compile<TOut = unknown, TIn extends EvaluatorContexts = EvaluatorContexts>(
    source: string,
  ): (...contexts: TIn) => TOut {
    const entry = this.#analyzer.analyze(source);
    return (...contexts: TIn) => this.#run(entry, contexts) as TOut;
  }

  /**
   * Runs a source against contexts. A name resolves to a host function first, then to the contexts last to first,
   * then to `resolveGlobal`. `TOut` asserts the result type; an async host function's call returns its promise.
   *
   * @example
   * evaluator.eval("scopes.root.rows.length", { scopes });
   * const user = await evaluator.eval("getUser({ id: 7 })"); // { id: 7, name: "Ada" }
   */
  eval<TOut = unknown, TIn extends EvaluatorContexts = EvaluatorContexts>(source: string, ...contexts: TIn): TOut {
    return this.#run(this.#analyzer.analyze(source), contexts) as TOut;
  }

  /**
   * The language rules, run once per source. Override it to add a rule; throw an `ExpressionError` to refuse.
   *
   * @example
   * protected override check(source: string) {
   *   super.check(source);
   *   if (source.includes("Date.now")) throw new ExpressionError("Date.now() is not allowed here");
   * }
   */
  protected check(source: string): void {
    validateExpression(this.#analyzer.parse(source), this.#isHostFunction);
  }

  /**
   * Resolves a name no context and no host function has: one of the language's globals, or an `unknown-reference`
   * error. Override it to add a name.
   *
   * @example
   * protected override resolveGlobal(name: string) {
   *   return name === "RATE" ? 0.2 : super.resolveGlobal(name);
   * }
   */
  protected resolveGlobal(name: string): unknown {
    const globals = this.toFunction ? PLATFORM_GLOBALS : GLOBAL_VALUES;
    return Object.hasOwn(globals, name) ? globals[name] : unknownName(name);
  }

  /**
   * One host-function call: `inputSchema` checks the argument, `execute` runs, `outputSchema` checks the result, and
   * both must be plain data. Override it to wrap every call.
   *
   * @example
   * protected override callHostFunction(fn: StandardToolV0, input: unknown) {
   *   console.debug(fn.name, input);
   *   return super.callHostFunction(fn, input);
   * }
   */
  protected callHostFunction(fn: StandardToolV0, input: unknown): unknown {
    return callTool(fn, input);
  }

  /**
   * The exit gate: only plain data leaves, and a promise only as the whole result. Override it to add a rule.
   *
   * @example
   * protected override checkResult(value: unknown) {
   *   super.checkResult(value);
   *   if (typeof value === "string" && value.length > 200) throw new ExpressionError("Too long for this slot");
   * }
   */
  protected checkResult(value: unknown): void {
    // Most results are primitives, so only an object is walked.
    if (typeof value === "object" || typeof value === "function") assertData(value, "The result", true);
  }

  /**
   * Set it to run expressions as JavaScript: called once per expression with what `new Function` takes, it returns
   * what `new Function` returns. The rules and the exit gate still run, but nothing meters that function (`budget`
   * does not apply) and a name built at run time reaches anything, so use it only for sources you trust.
   *
   * @example
   * class TrustedEvaluator extends Evaluator {
   *   protected override toFunction(names: readonly string[], body: string) {
   *     return new Function(...names, body);
   *   }
   * }
   */
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
    const args = freeIds.map((name, i) =>
      hostFunctions[name] ? `hosts[${i}]` : `lookup(${JSON.stringify(name)}, contexts)`,
    );
    const body = `"use strict";
const inner = function (${freeIds.join(", ")}) { return (${source}\n); };
return function (contexts) { return inner(${args.join(", ")}); };`;
    const hosts = freeIds.map((name) => hostFunctions[name]);
    const lookup = (name: string, contexts: EvaluatorContexts) => lookupName(name, contexts, global);
    try {
      return this.toFunction(["hosts", "lookup"], body)(hosts, lookup);
    } catch (err) {
      if (ExpressionError.is(err)) throw err;
      throw new ExpressionError(
        `Failed to compile expression: ${messageOf(err)}. Expression: ${source}`,
        "expression-syntax",
        err,
      );
    }
  }
}
