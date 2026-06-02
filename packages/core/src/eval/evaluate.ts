import type { ValueSource } from "../types";
import { SafeEval } from "./SafeEval";

const safeEval = new SafeEval({
  allowGlobals: [
    "Array",
    "Object",
    "Math",
    "Date",
    "JSON",
    "String",
    "Number",
    "Boolean",
    "RegExp",
    "parseInt",
    "parseFloat",
    "isNaN",
    "isFinite",
    "undefined",
    "NaN",
    "Infinity",
  ],
});

/**
 * Return every `scopes.X.Y` path the given expression reads. Thin wrapper
 * around the module-private SafeEval singleton so consumers (e.g.
 * `extractDeps`) don't have to reach into the evaluator. Uses the same
 * parse-and-validate cache that `safeEval.eval()` does — first call parses
 * once, subsequent calls are O(1) cache hits.
 */
export const getScopeReads = (expr: string): string[] =>
  safeEval.scopeReads(expr);

// Functions exposed as bare identifiers inside the eval scope. Consumers
// (e.g. a consumer's host-function map) wire them in via
// <Renderer functions={...} />, which threads them through the
// RendererRegistry context to every evaluate() call site. Spread *after*
// context so a consumer-provided function wins over an equally-named scope
// variable — the LLM is prompted with these names and expects them to be
// the host-provided callables.
// `any` here (not `unknown`) is deliberate: with strict function types,
// `(...args: unknown[]) => unknown` is contravariant on parameters and
// rejects concrete signatures like `(input: { id: string }) => Promise<T>`
// — which is exactly what consumers pass in (e.g. google-tools). The
// runtime is fundamentally dynamic dispatch over LLM-emitted call sites;
// the eval boundary can't constrain shapes the way a typed RPC can.
// biome-ignore lint/suspicious/noExplicitAny: see comment above
export type EvaluateFunctions = Record<string, (...args: any[]) => any>;

// Evaluate a ValueSource to its value: a `literal` is returned as-is, an `expr`
// is run through SafeEval against `context` + host `functions`. Returns
// `unknown` — an async `expr` resolves to a Promise, which callers detect with
// `value instanceof Promise`. (There's no Promise-typed overload for the
// assignable forms: a literal-form assignable returns synchronously, so a
// conditional `… ? Promise<unknown> : unknown` return type would be a lie —
// and that lie was what forced an `as any` on every return.)
export const evaluate = (
  expr: ValueSource,
  context: Record<string, any>,
  options?: { functions?: EvaluateFunctions },
): unknown => {
  if ("literal" in expr) return expr.literal;
  if (!expr.expr) return null;
  return safeEval.eval(expr.expr, {
    ...context,
    ...(options?.functions ?? {}),
  });
};
