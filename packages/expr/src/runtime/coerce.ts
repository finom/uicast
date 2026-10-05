import type { Budget } from "./budget";
import { isPlainObject, Namespace, reject } from "./values";

// The engine's own conversions run in time of their input: an array joins into text, a string parses into a number.
// Each is charged here before the engine runs it.

// Widest a JSON scalar prints: `-1.7976931348623157e+308` is 24 characters.
export const JSON_SCALAR_WIDTH = 24;

// Nested arrays join too. A function would print its source.
export const joinedSize = (items: unknown[], budget: Budget): number => {
  let size = 0;
  for (const item of items) {
    budget.tick(1);
    if (typeof item === "string") size += item.length;
    else if (Array.isArray(item)) size += joinedSize(item, budget);
    else if (typeof item === "function") reject("An array holds a function, which cannot be read in an expression");
    else size += JSON_SCALAR_WIDTH;
  }
  return size;
};

// Turning a value into text: only an array is long, joined in time and memory of its text. A function would print its source.
export const chargeText = (v: unknown, budget: Budget): void => {
  if (typeof v === "function") reject("A function cannot be read in an expression");
  if (!Array.isArray(v)) return;
  const size = joinedSize(v, budget);
  budget.string(size);
};

// Turning a value into a number: a string parses in time of its length, an array joins first.
export const chargeNumber = (v: unknown, budget: Budget): void => {
  if (typeof v === "string") budget.text(v.length);
  else chargeText(v, budget);
};

// Two strings compare at memory speed; any other pair converts to numbers first.
export const chargeCompare = (l: unknown, r: unknown, budget: Budget): void => {
  if (typeof l === "string" && typeof r === "string") {
    budget.text(Math.min(l.length, r.length));
    return;
  }
  chargeNumber(l, budget);
  chargeNumber(r, budget);
};

// JS's ToNumber, charged. An array joins into text first, so an item that has no text throws, as in JS.
export const num = (v: unknown, budget: Budget): number => {
  if (typeof v === "number") return v;
  chargeNumber(v, budget);
  return Number(v);
};

// JS's ToIntegerOrInfinity: NaN is 0.
export const toInteger = (v: unknown, budget: Budget): number => {
  const n = Math.trunc(num(v, budget));
  return Number.isNaN(n) ? 0 : n;
};

// JS's ToLength: NaN and negatives are 0.
export const toLength = (v: unknown, budget: Budget): number => {
  const n = toInteger(v, budget);
  return n > 0 ? Math.min(n, Number.MAX_SAFE_INTEGER) : 0;
};

// Quotes, backslashes, control characters and lone surrogates print escaped, up to six characters each (`\u0001`).
const jsonStringSize = (s: string): number => {
  let size = s.length + 2;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c < 0x20 || c === 0x22 || c === 0x5c) size += 5;
    else if (c >= 0xd800 && c <= 0xdbff && (s.charCodeAt(i + 1) & 0xfc00) === 0xdc00) i++;
    else if (c >= 0xd800 && c <= 0xdfff) size += 5;
  }
  return size;
};

// `globals` notes a Math or JSON value, which only a replacer prints as JS does.
export const jsonSize = (
  value: unknown,
  indent: number,
  depth: number,
  budget: Budget,
  globals: { found: boolean } = { found: false },
): number => {
  budget.tick(1);
  if (typeof value === "string") {
    budget.text(value.length);
    return jsonStringSize(value);
  }
  if (value instanceof Namespace) globals.found = true;
  if (value === null || typeof value !== "object") return JSON_SCALAR_WIDTH;
  const newline = 1 + indent * (depth + 1);
  let size = 2;
  if (Array.isArray(value)) {
    for (const item of value) size += newline + 1 + jsonSize(item, indent, depth + 1, budget, globals);
  } else if (isPlainObject(value)) {
    for (const [key, item] of Object.entries(value)) {
      size += newline + key.length + 4 + jsonSize(item, indent, depth + 1, budget, globals);
    }
  }
  return size;
};
