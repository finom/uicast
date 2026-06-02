import type { AssignableExpr, ValueExpr } from "../types";
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
// (e.g. neat-report's google-tools `functions` map) wire them in via
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

export const evaluate = <T extends ValueExpr>(
  expr: T,
  context: Record<string, any>,
  options?: { functions?: EvaluateFunctions },
): T extends AssignableExpr ? Promise<unknown> : unknown => {
  if (expr.literal !== undefined) return expr.literal as any;
  if (!expr.expr) return null as any;
  return safeEval.eval(expr.expr, {
    ...context,
    ...(options?.functions ?? {}),
  }) as any;
};
