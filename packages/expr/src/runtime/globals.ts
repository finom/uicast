import {
  ALLOWED_GLOBALS,
  CALLABLE_GLOBALS,
  CALLBACK_GLOBALS,
  CONSTANT_GLOBALS,
  NAMESPACE_GLOBALS,
  nullProto,
  OBJECT_NAMESPACES,
} from "../constants/globals";
import { CALLBACK_ARGUMENT } from "../constants/methods";
import { ExpressionError } from "../errors";
import type { Budget } from "./budget";
import { chargeNumber } from "./coerce";
import { chargeResult } from "./membrane";
import { fail, Lambda, Namespace, reject, runtimeFault } from "./values";

type GlobalFn = (...args: unknown[]) => unknown;
const platform = (name: string): unknown => (globalThis as Record<string, unknown>)[name];

export const GLOBAL_VALUES: Readonly<Record<string, unknown>> = Object.freeze({
  ...Object.fromEntries(NAMESPACE_GLOBALS.map((name) => [name, new Namespace(name)])),
  ...CONSTANT_GLOBALS,
});

// The same names as the engine's own objects, for an expression the engine runs.
export const PLATFORM_GLOBALS: Readonly<Record<string, unknown>> = Object.freeze(
  Object.fromEntries(ALLOWED_GLOBALS.map((name) => [name, platform(name)])),
);

export const GLOBAL_FUNCTIONS: Readonly<Record<string, GlobalFn>> = nullProto(
  Object.fromEntries([...CALLABLE_GLOBALS].map((name) => [name, platform(name) as GlobalFn])),
);

// The contexts last to first, then `global` for a name none of them has.
export const lookupName = (
  name: string,
  contexts: readonly Record<string, unknown>[],
  global: (name: string) => unknown,
): unknown => {
  for (let i = contexts.length - 1; i >= 0; i--) {
    if (!Object.hasOwn(contexts[i], name)) continue;
    const value = contexts[i][name];
    // A function is never a value: it would print its source.
    if (typeof value === "function")
      throw new ExpressionError(`"${name}" holds a function, which cannot be read in an expression`);
    return value;
  }
  return global(name);
};

export const unknownName = (name: string): never => {
  throw new ExpressionError(`"${name}" is not available in expressions`, "unknown-reference");
};

export const callGlobal = (name: string, args: unknown[], budget: Budget): unknown => {
  const fn = GLOBAL_FUNCTIONS[name];
  if (fn === undefined) return (OBJECT_NAMESPACES.has(name) ? fail : reject)(`"${name}" cannot be called`);
  for (const arg of args) chargeNumber(arg, budget);
  try {
    return chargeResult(fn(...args), name, budget);
  } catch (err) {
    return runtimeFault(`${name}()`, err);
  }
};

// A global from CALLBACK_GLOBALS where a method takes its callback is called with the item alone.
export const withGlobalCallback = (key: unknown, args: unknown[], budget: Budget): unknown[] => {
  const index = typeof key === "string" ? CALLBACK_ARGUMENT[key] : undefined;
  if (index === undefined) return args;
  const f = args[index];
  if (f instanceof Namespace && CALLBACK_GLOBALS.has(f.name))
    args[index] = new Lambda((item) => callGlobal(f.name, [item], budget));
  return args;
};
