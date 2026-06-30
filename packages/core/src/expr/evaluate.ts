import type { StandardToolV0Definition } from "standard-tool";
import type { ValueSource } from "../types";
import { ALLOWED_GLOBALS } from "./globals";
import { SafeEval } from "./safe-eval";

const safeEval = new SafeEval({
  allowGlobals: ALLOWED_GLOBALS,
  enforceAllowlist: true,
});

// Every scopes.X.Y path an expression reads, via the shared SafeEval singleton
// (so extractDeps doesn't reach into the evaluator). Same parse cache as eval().
export const getScopeReads = (expr: string): string[] =>
  safeEval.scopeReads(expr);

// Evaluate a ValueSource: a `literal` is returned as-is, an `expr` runs through
// SafeEval against context + host functions. Returns unknown — an async expr
// resolves to a Promise (callers check `value instanceof Promise`). `functions`
// (a StandardToolV0Definition[]) are spread after context, so a host fn wins a name clash.
export const evaluate = (
  expr: ValueSource,
  context: Record<string, unknown>,
  options?: { functions?: StandardToolV0Definition[]; allowedGlobals?: string[] },
): unknown => {
  if ("literal" in expr) return expr.literal;
  if (!expr.expr) return null;
  const functions = Object.fromEntries(
    (options?.functions ?? []).map((tool) => [
      tool.name,
      (input: unknown) => tool.execute(input),
    ]),
  );
  return safeEval.eval(
    expr.expr,
    { ...context, ...functions },
    options?.allowedGlobals,
  );
};
