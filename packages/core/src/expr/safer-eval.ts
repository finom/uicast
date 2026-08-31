import * as acorn from "acorn";
import {
  containsAwait,
  extractFreeIdentifiers,
  extractScopeReads,
} from "./analyze";
import { GLOBALS_TO_SHADOW } from "./globals";
import { SaferEvalError, validateNode } from "./validate";

// Compiles and runs the expressions validate.ts approves: parse + analyse once
// (cached), compile to a Function (AsyncFunction when the expr uses `await`),
// shadow ambient globals as undefined params, run in-realm so Proxy state works.
// Guardrail, not a sandbox — see the Expressions docs page, § Safety.

export { SaferEvalError };

// The AsyncFunction constructor, for expressions that use `await`.
const AsyncFunction = Object.getPrototypeOf(async () => {})
  .constructor as typeof Function;

type CacheEntry = {
  isAsync: boolean;
  scopeReads: readonly string[];
  freeIds: readonly string[];
  // Built lazily on first compile(); validate()/scopeReads() leave it unset.
  fn?: (context: Record<string, unknown>) => unknown;
};

export class SaferEval {
  #cache = new Map<string, CacheEntry>();
  #maxCacheSize: number;
  #shadowParams: string[];
  #allowGlobals: Set<string>;
  #enforceAllowlist: boolean;

  constructor(
    options: {
      maxCacheSize?: number;
      extraGlobalsToShadow?: string[];
      allowGlobals?: string[];
      enforceAllowlist?: boolean;
    } = {},
  ) {
    const {
      maxCacheSize = 500,
      extraGlobalsToShadow = [],
      allowGlobals = [],
      enforceAllowlist = false,
    } = options;

    this.#maxCacheSize = maxCacheSize;
    this.#enforceAllowlist = enforceAllowlist;

    const allowSet = new Set(allowGlobals);
    this.#allowGlobals = allowSet;
    this.#shadowParams = [...GLOBALS_TO_SHADOW, ...extraGlobalsToShadow].filter(
      (g) => !allowSet.has(g),
    );
  }

  // Parse + validate + analyse, once per expression (cached). Throws
  // SaferEvalError if invalid. The arrays are frozen because callers get the
  // cache's own copies — a mutation would poison every later call.
  #analyze(expression: string): CacheEntry {
    if (typeof expression !== "string") {
      throw new SaferEvalError("Expression must be a string", "expression-syntax");
    }

    const trimmed = expression.trim();
    if (!trimmed) {
      throw new SaferEvalError("Expression cannot be empty", "expression-syntax");
    }

    const cached = this.#cache.get(expression);
    if (cached) return cached;

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
      throw new SaferEvalError(
        `Syntax error: ${e instanceof Error ? e.message : String(e)}. Expression: ${expression}`,
        "expression-syntax",
      );
    }

    validateNode(ast);

    const entry: CacheEntry = {
      isAsync: containsAwait(ast),
      scopeReads: Object.freeze(extractScopeReads(ast)),
      freeIds: Object.freeze(extractFreeIdentifiers(ast)),
    };

    // Evict oldest when full.
    if (this.#cache.size >= this.#maxCacheSize) {
      const firstKey = this.#cache.keys().next().value;
      if (firstKey !== undefined) this.#cache.delete(firstKey);
    }
    this.#cache.set(expression, entry);

    return entry;
  }

  // Parse + validate without running. Throws SaferEvalError if invalid.
  validate(expression: string): {
    isAsync: boolean;
    scopeReads: readonly string[];
    freeIds: readonly string[];
  } {
    const { isAsync, scopeReads, freeIds } = this.#analyze(expression);
    return { isAsync, scopeReads, freeIds };
  }

  // Compile to a reusable fn (returns a Promise if the expr uses `await`).
  compile(expression: string): (context: Record<string, unknown>) => unknown {
    const entry = this.#analyze(expression);
    if (entry.fn) return entry.fn;

    const expr = expression.trim();
    const Ctor = entry.isAsync ? AsyncFunction : Function;

    // Single-slot cache: new Ctor bakes in the param names (context keys ∪ shadow
    // params), so it recompiles only if the context shape changes — which it
    // doesn't in practice (a given expr always sees the same keys).
    let cachedSig: string | undefined;
    let cachedFn: ((...args: unknown[]) => unknown) | undefined;
    let cachedShadowCount = 0;

    const evaluator = (context: Record<string, unknown>) => {
      const contextKeys = Object.keys(context);
      const sig = contextKeys.join("\u0000");
      if (sig !== cachedSig) {
        // A context key can collide with a shadow param (a host tool named
        // "fetch"). Dropping the shadow lets the injected value win — and
        // avoids the duplicate-param SyntaxError strict mode would throw.
        const keySet = new Set(contextKeys);
        const shadows = this.#shadowParams.filter((p) => !keySet.has(p));
        try {
          cachedFn = new Ctor(
            ...contextKeys,
            ...shadows,
            `"use strict"; return (${expr})`,
          ) as (...args: unknown[]) => unknown;
        } catch (e: unknown) {
          // Parsed but won't compile — surface as SaferEvalError, not a raw one.
          throw new SaferEvalError(
            `Failed to compile expression: ${
              e instanceof Error ? e.message : String(e)
            }. Expression: ${expression}`,
            "expression-syntax",
          );
        }
        cachedShadowCount = shadows.length;
        cachedSig = sig;
      }

      // Args match the params: context values (Object.keys order), then an
      // undefined per remaining shadow param.
      const allArgs = [
        ...Object.values(context),
        ...new Array(cachedShadowCount).fill(undefined),
      ];
      return (cachedFn as (...args: unknown[]) => unknown)(...allArgs);
    };

    entry.fn = evaluator;
    return evaluator;
  }

  isAsync(expression: string): boolean {
    return this.#analyze(expression).isAsync;
  }

  // Every `scopes.X.Y` path the expression reads — the renderer auto-subscribes
  // to these instead of the LLM writing a deps array.
  scopeReads(expression: string): readonly string[] {
    return this.#analyze(expression).scopeReads;
  }

  // Allowlist gate: every free identifier must be an injected context name, a
  // base allowed global, or one the host opted into via allowGlobals.
  #checkAllowlist(
    freeIds: readonly string[],
    contextKeys: string[],
    allowGlobals: string[],
  ): void {
    const allowed = new Set([
      ...contextKeys,
      ...this.#allowGlobals,
      ...allowGlobals,
    ]);
    for (const id of freeIds) {
      if (!allowed.has(id)) {
        // The expression named something that doesn't exist here — an
        // unregistered function or a global outside the allowlist.
        throw new SaferEvalError(
          `"${id}" is not available in expressions`,
          "unknown-reference",
        );
      }
    }
  }

  eval(
    expression: string,
    context: Record<string, unknown> = {},
    allowGlobals: string[] = [],
  ): unknown {
    if (this.#enforceAllowlist) {
      const { freeIds } = this.#analyze(expression);
      this.#checkAllowlist(freeIds, Object.keys(context), allowGlobals);
    }
    const evaluator = this.compile(expression);
    return evaluator(context);
  }

  clearCache(): void {
    this.#cache.clear();
  }
}
