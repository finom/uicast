import type { StandardToolV0 } from "standard-tool";
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
export const getScopeReads = (expr: string): readonly string[] =>
  saferEval.scopeReads(expr);

// The expression's free identifiers — names it reads from outside (host
// functions, globals). The react binding uses this to spot host-function calls
// in callback steps; same parse cache as eval(). Throws on an invalid
// expression, like every other analysis entry point.
export const getFreeIdentifiers = (expr: string): readonly string[] =>
  saferEval.validate(expr).freeIds;

// Host functions become expression context params, so their names must be legal
// JS parameter names — otherwise Function compilation fails with an opaque
// syntax error blamed on the document. The regex screens the shape; the compile
// probe catches reserved words ("delete", "class", "let", "await", …), which
// the regex can't. Cached per name — the check runs on every evaluate().
const IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
const AsyncFunctionCtor = Object.getPrototypeOf(async () => {})
  .constructor as typeof Function;
const NAME_USABLE = new Map<string, boolean>();
const isUsableName = (name: string): boolean => {
  let usable = NAME_USABLE.get(name);
  if (usable === undefined) {
    usable = IDENTIFIER.test(name);
    if (usable) {
      try {
        // AsyncFunction + strict body matches what SaferEval compiles with,
        // so this rejects exactly the names that would break there.
        new AsyncFunctionCtor(name, '"use strict";');
      } catch {
        usable = false;
      }
    }
    NAME_USABLE.set(name, usable);
  }
  return usable;
};

// standard-tool's input-validation failure, detected structurally: two package
// copies can coexist in one bundle, where `instanceof` silently fails.
const isToolInputValidationError = (err: unknown): boolean =>
  err instanceof Error &&
  err.name === "StandardToolValidationError" &&
  (err as { target?: unknown }).target === "input";

// Anything escaping `tool.execute` is host code failing — with two exceptions:
// the tool's input schema rejecting the arguments is the document's fault
// (it made the call), and an EntryError the host classified itself passes
// through untouched.
const wrapToolError = (err: unknown): EntryError =>
  EntryError.wrap(
    err,
    isToolInputValidationError(err) ? "invalid-arguments" : "host-function",
  );

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
// (a StandardToolV0[]) are spread after context, so a host fn wins a name clash.
// Every failure surfaces as a classified EntryError.
export const evaluate = (
  expr: ValueSource,
  context: Record<string, unknown>,
  options?: { functions?: StandardToolV0[]; allowGlobals?: string[] },
): unknown => {
  if ("literal" in expr) return expr.literal;
  // Absent expr means "no value"; an empty string falls through to SaferEval,
  // which rejects it as a classified document fault.
  if (expr.expr == null) return null;
  const functions = Object.fromEntries(
    (options?.functions ?? []).map((tool) => {
      if (!isUsableName(tool.name)) {
        throw new EntryError(
          `Host function name "${tool.name}" is not a valid identifier — rename it (letters, digits, _ and $, not starting with a digit, not a JS reserved word)`,
          { reason: "host-function" },
        );
      }
      return [
        tool.name,
        (input: unknown) => {
          try {
            const result = tool.execute(input);
            return result instanceof Promise
              ? result.catch((err) => {
                  throw wrapToolError(err);
                })
              : result;
          } catch (err) {
            throw wrapToolError(err);
          }
        },
      ];
    }),
  );
  try {
    const result = saferEval.eval(
      expr.expr,
      { ...context, ...functions },
      options?.allowGlobals,
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
