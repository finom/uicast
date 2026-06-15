import type { StandardTool } from "standard-tool";
import type { ValueSource } from "../types";
import { ALLOWED_GLOBALS } from "./allowed-globals";
import { SafeEval } from "./safe-eval";

const safeEval = new SafeEval({ allowGlobals: ALLOWED_GLOBALS });

/**
 * Return every `scopes.X.Y` path the given expression reads. Thin wrapper
 * around the module-private SafeEval singleton so consumers (e.g.
 * `extractDeps`) don't have to reach into the evaluator. Uses the same
 * parse-and-validate cache that `safeEval.eval()` does — first call parses
 * once, subsequent calls are O(1) cache hits.
 */
export const getScopeReads = (expr: string): string[] =>
  safeEval.scopeReads(expr);

// Evaluate a ValueSource to its value: a `literal` is returned as-is, an `expr`
// is run through SafeEval against `context` + the host `functions`. Returns
// `unknown` — an async `expr` (or a tool whose `execute` is async) resolves to
// a Promise, which callers detect with `value instanceof Promise`.
//
// `functions` is the same `StandardTool[]` the prompt is generated from (see
// getFunctionsPartialPrompt). An expression calls `name(input)`, which maps to
// `tool.execute(input)`. They're spread *after* context so a host function wins
// over an equally-named scope variable — the LLM is prompted with these names.
export const evaluate = (
  expr: ValueSource,
  context: Record<string, unknown>,
  options?: { functions?: StandardTool[] },
): unknown => {
  if ("literal" in expr) return expr.literal;
  if (!expr.expr) return null;
  const functions = Object.fromEntries(
    (options?.functions ?? []).map((tool) => [
      tool.name,
      (input: unknown) => tool.execute(input),
    ]),
  );
  return safeEval.eval(expr.expr, { ...context, ...functions });
};
