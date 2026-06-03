/**
 * Globals an expression may reference — the single source of truth.
 *
 * Consumed by `evaluate.ts` (passed to SafeEval as `allowGlobals`, so they're
 * never shadowed) and reusable by the prompt builder to tell the LLM exactly
 * what's available. Every entry is also usable with `new` (e.g. `new Map()`).
 * Anything not listed and not in the call context resolves to `undefined`.
 */
export const ALLOWED_GLOBALS: string[] = [
  // Namespaces / utilities
  "Math",
  "JSON",
  "Intl",
  "Object",
  "Array",
  // Coercion (use as calls — `new Number(x)` etc. boxes the value)
  "Number",
  "String",
  "Boolean",
  "parseInt",
  "parseFloat",
  // Predicates / constants
  "isNaN",
  "isFinite",
  "undefined",
  "NaN",
  "Infinity",
  // URI helpers
  "encodeURIComponent",
  "decodeURIComponent",
  "encodeURI",
  "decodeURI",
  // Constructors & async
  "Date",
  "Map",
  "Set",
  "RegExp",
  "URL",
  "URLSearchParams",
  "Promise",
  "BigInt",
];
