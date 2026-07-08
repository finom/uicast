import type { StandardToolV0Definition } from "standard-tool";
import type { ValueSource } from "../types";
import { EntryError } from "../entry-error";
import { ALLOWED_GLOBALS } from "./globals";
import { SaferEval, SaferEvalError } from "./safer-eval";

const saferEval = new SaferEval({
  allowGlobals: ALLOWED_GLOBALS,
  enforceAllowlist: true,
});

// Every scopes.X.Y path an expression reads, via the shared SaferEval singleton
// (so extractDeps doesn't reach into the evaluator). Same parse cache as eval().
export const getScopeReads = (expr: string): string[] =>
  saferEval.scopeReads(expr);

// Classify an evaluation failure by provenance: SaferEval's own rejections
// carry their reason (syntax / policy / unknown identifier); an EntryError
// passes through (a host function already tagged it); anything else threw
// while the compiled expression ran.
const wrapEvalError = (err: unknown): EntryError => {
  if (EntryError.is(err)) return err;
  if (err instanceof SaferEvalError) return EntryError.wrap(err, err.reason);
  return EntryError.wrap(err, "expression-runtime");
};

// Evaluate a ValueSource: a `literal` is returned as-is, an `expr` runs through
// SaferEval against context + host functions. Returns unknown — an async expr
// resolves to a Promise (callers check `value instanceof Promise`). `functions`
// (a StandardToolV0Definition[]) are spread after context, so a host fn wins a name clash.
// Every failure surfaces as a classified EntryError.
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
      // This closure is the engine/host boundary: anything escaping
      // `tool.execute` is host code failing — unless the host already threw a
      // classified EntryError itself (e.g. "invalid-arguments"), which wrap()
      // passes through.
      (input: unknown) => {
        try {
          const result = tool.execute(input);
          return result instanceof Promise
            ? result.catch((err) => {
                throw EntryError.wrap(err, "host-function");
              })
            : result;
        } catch (err) {
          throw EntryError.wrap(err, "host-function");
        }
      },
    ]),
  );
  try {
    const result = saferEval.eval(
      expr.expr,
      { ...context, ...functions },
      options?.allowedGlobals,
    );
    return result instanceof Promise
      ? result.catch((err) => {
          throw wrapEvalError(err);
        })
      : result;
  } catch (err) {
    throw wrapEvalError(err);
  }
};
