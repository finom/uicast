import { EntryError } from "./entry-error";
import type { ComponentEntry } from "./types";

// A line is model output that only claims the entry type, so each field is `unknown` until checked.
type RawEntry = { [K in keyof ComponentEntry]?: unknown };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const jsonType = (value: unknown): string => {
  if (value === null) return "null";
  if (Array.isArray(value)) return "an array";
  if (typeof value === "object") return "an object";
  return `a ${typeof value}`;
};

const expected = (at: string, what: string, value: unknown): string =>
  `"${at}" must be ${what}, got ${jsonType(value)}.`;

// No `expr` (or `null`) is no value, as `evaluate` reads it.
const exprFault = (source: Record<string, unknown>, at: string): string | null =>
  source.expr == null || typeof source.expr === "string"
    ? null
    : expected(`${at}.expr`, "an expression string", source.expr);

const stepsFault = (steps: unknown, at: string, setRequired: boolean): string | null => {
  if (!Array.isArray(steps)) return expected(at, "an array of steps", steps);
  for (const [i, step] of steps.entries()) {
    const here = `${at}[${i}]`;
    if (!isRecord(step)) return expected(here, 'a step ({ "set": "…", "expr": "…" })', step);
    if (setRequired && step.set === undefined) return `"${here}" has no "set": a seed step writes one field.`;
    if (step.set !== undefined && typeof step.set !== "string")
      return expected(`${here}.set`, "an address string", step.set);
    if (step.confirm !== undefined && typeof step.confirm !== "string") {
      return expected(`${here}.confirm`, "a message string", step.confirm);
    }
    if (step.debounce !== undefined && typeof step.debounce !== "boolean") {
      return expected(`${here}.debounce`, "true or false", step.debounce);
    }
    const fault = exprFault(step, here);
    if (fault) return fault;
  }
  return null;
};

const STRING_FIELDS = ["hidden", "loading", "each", "as", "keyBy"] as const;

const shapeFault = (entry: RawEntry): string | null => {
  if (entry.props !== undefined) {
    if (!isRecord(entry.props)) return expected("props", '{ "expr": "…" } or { "literal": … }', entry.props);
    const fault = exprFault(entry.props, "props");
    if (fault) return fault;
  }
  for (const field of STRING_FIELDS) {
    const value = entry[field];
    if (value !== undefined && typeof value !== "string") return expected(field, "a string", value);
  }
  if (entry.each !== undefined && entry.as === undefined) return 'A list needs "as": the name its rows are read under.';
  if (typeof entry.as === "string" && entry.as.startsWith("$"))
    return `"as": "${entry.as}" starts with "$", which marks a row's own scope, "scopes.$<as>".`;
  if (entry.children !== undefined) {
    if (!Array.isArray(entry.children)) return expected("children", "an array of element keys", entry.children);
    const i = entry.children.findIndex((child) => typeof child !== "string");
    if (i !== -1) return expected(`children[${i}]`, "an element key string", entry.children[i]);
  }
  if (entry.seed !== undefined) {
    const fault = stepsFault(entry.seed, "seed", true);
    if (fault) return fault;
  }
  if (entry.callbacks !== undefined) {
    if (!isRecord(entry.callbacks)) return expected("callbacks", "an object of step arrays", entry.callbacks);
    for (const [name, steps] of Object.entries(entry.callbacks)) {
      const fault = stepsFault(steps, `callbacks.${name}`, false);
      if (fault) return fault;
    }
  }
  return null;
};

// Every field but `key` and `component`. The message names the field, so a re-emit can fix it.
export const entryShapeError = (entry: RawEntry): EntryError | null => {
  const fault = shapeFault(entry);
  if (!fault) return null;
  const elementKey = typeof entry.key === "string" ? entry.key : undefined;
  return new EntryError(fault, { reason: "invalid-entry", elementKey });
};
