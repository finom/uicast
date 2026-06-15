import * as acorn from "acorn";
import { containsAwait, extractScopeReads } from "./analyze";
import { GLOBALS_TO_SHADOW } from "./globals";
import { SafeEvalError, validateNode } from "./validate";

// Compiles and runs the expressions validate.ts approves: parse + analyse once
// (cached), compile to a Function (AsyncFunction when the expr uses `await`),
// shadow ambient globals as undefined params, run in-realm so Proxy state works.
// Guardrail, not a sandbox — see docs/EXPRESSIONS.md.

// Re-exported from validate.ts for callers of this module.
export { SafeEvalError };

// The AsyncFunction constructor, for expressions that use `await`.
const AsyncFunction = Object.getPrototypeOf(async () => {})
  .constructor as typeof Function;

type CacheEntry = {
  isAsync: boolean;
  scopeReads: string[];
  // Built lazily on first compile(); validate()/scopeReads() leave it unset.
  fn?: (context: Record<string, unknown>) => unknown;
};

export class SafeEval {
  #cache = new Map<string, CacheEntry>();
  #maxCacheSize: number;
  #shadowParams: string[];

  constructor(
    options: {
      maxCacheSize?: number;
      extraGlobalsToShadow?: string[];
      allowGlobals?: string[];
    } = {},
  ) {
    const {
      maxCacheSize = 500,
      extraGlobalsToShadow = [],
      allowGlobals = [],
    } = options;

    this.#maxCacheSize = maxCacheSize;

    const allowSet = new Set(allowGlobals);
    this.#shadowParams = [...GLOBALS_TO_SHADOW, ...extraGlobalsToShadow].filter(
      (g) => !allowSet.has(g),
    );
  }

  // Parse + validate without running. Throws SafeEvalError if invalid; returns
  // isAsync + scopeReads and caches the analysis (compile() builds the fn later).
  validate(expression: string): { isAsync: boolean; scopeReads: string[] } {
    if (typeof expression !== "string") {
      throw new SafeEvalError("Expression must be a string");
    }

    const trimmed = expression.trim();
    if (!trimmed) {
      throw new SafeEvalError("Expression cannot be empty");
    }

    const cached = this.#cache.get(expression);
    if (cached) {
      return { isAsync: cached.isAsync, scopeReads: cached.scopeReads };
    }

    // Parse as `"use strict"; void (expr)`: void(...) forces expression context
    // (so `{...}` is an object literal, not a block), and strict mode rejects
    // sloppy-only constructs (octal, `with`, dup params) here, not at compile.
    const wrapper = `"use strict"; void (${trimmed})`;
    let ast: acorn.Program;
    try {
      ast = acorn.parse(wrapper, {
        ecmaVersion: 2022,
        sourceType: "script",
        allowAwaitOutsideFunction: true,
      });
    } catch (e: unknown) {
      throw new SafeEvalError(
        `Syntax error: ${e instanceof Error ? e.message : String(e)}. Expression: ${expression}`,
      );
    }

    validateNode(ast);

    const analysis = {
      isAsync: containsAwait(ast),
      scopeReads: extractScopeReads(ast),
    };

    // Cache the analysis (no fn yet); evict oldest when full.
    if (this.#cache.size >= this.#maxCacheSize) {
      const firstKey = this.#cache.keys().next().value;
      if (firstKey !== undefined) this.#cache.delete(firstKey);
    }
    this.#cache.set(expression, { ...analysis });

    return analysis;
  }

  // Compile to a reusable fn (returns a Promise if the expr uses `await`).
  compile(expression: string): (context: Record<string, unknown>) => unknown {
    const { isAsync } = this.validate(expression);
    const entry = this.#cache.get(expression);
    if (!entry) {
      // Unreachable — validate() just inserted this entry.
      throw new SafeEvalError(
        `Cache entry missing for expression: ${expression}`,
      );
    }
    if (entry.fn) return entry.fn;

    const expr = expression.trim();
    const Ctor = isAsync ? AsyncFunction : Function;

    // Single-slot cache: new Ctor bakes in the param names (context keys ∪ shadow
    // params), so it recompiles only if the context shape changes — which it
    // doesn't in practice (a given expr always sees the same keys).
    let cachedSig: string | undefined;
    let cachedFn: ((...args: unknown[]) => unknown) | undefined;

    const evaluator = (context: Record<string, unknown>) => {
      const contextKeys = Object.keys(context);
      const sig = contextKeys.join("\u0000");
      if (sig !== cachedSig) {
        // Context keys become params; shadow params follow, bound to undefined.
        const allParams = [...contextKeys, ...this.#shadowParams];
        try {
          cachedFn = new Ctor(
            ...allParams,
            `"use strict"; return (${expr})`,
          ) as (...args: unknown[]) => unknown;
        } catch (e: unknown) {
          // Parsed but won't compile — surface as SafeEvalError, not a raw one.
          throw new SafeEvalError(
            `Failed to compile expression: ${
              e instanceof Error ? e.message : String(e)
            }. Expression: ${expression}`,
          );
        }
        cachedSig = sig;
      }

      // Args match allParams: context values (Object.keys order) then shadow fills.
      const allArgs = [
        ...Object.values(context),
        ...new Array(this.#shadowParams.length).fill(undefined),
      ];
      return (cachedFn as (...args: unknown[]) => unknown)(...allArgs);
    };

    entry.fn = evaluator;
    return evaluator;
  }

  isAsync(expression: string): boolean {
    const cached = this.#cache.get(expression);
    if (cached) return cached.isAsync;
    return this.validate(expression).isAsync;
  }

  // Every `scopes.X.Y` path the expression reads — the renderer auto-subscribes
  // to these instead of the LLM writing a deps array.
  scopeReads(expression: string): string[] {
    const cached = this.#cache.get(expression);
    if (cached) return cached.scopeReads;
    return this.validate(expression).scopeReads;
  }

  eval(expression: string, context: Record<string, unknown> = {}): unknown {
    const evaluator = this.compile(expression);
    return evaluator(context);
  }

  clearCache(): void {
    this.#cache.clear();
  }
}
