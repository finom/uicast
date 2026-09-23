import { globalCallbackMessage, OBJECT_NAMESPACES } from "../constants/globals";
import { ExpressionError } from "../errors";

// Positional slots, no arguments array per call; the method tables fill at most four.
type LambdaCall = (a?: unknown, b?: unknown, c?: unknown, d?: unknown, e?: unknown) => unknown;

export class Lambda {
	constructor(readonly call: LambdaCall) {}
}

// Never a value: the validator lets its name appear only as a callee.
export type HostFunction = (input: unknown) => unknown;

// Reads and calls on it go through the tables.
export class Namespace {
	constructor(readonly name: string) {}
}

// As JS answers it for the kinds above.
export const typeOf = (value: unknown): string => {
	if (value instanceof Namespace) return OBJECT_NAMESPACES.has(value.name) ? "object" : "function";
	return typeof value;
};

export const isPlainObject = (value: object): boolean => {
	const proto = Object.getPrototypeOf(value);
	return proto === Object.prototype || proto === null;
};

// For messages, in the names the expression uses.
export const typeName = (value: unknown): string => {
	if (value === null) return "null";
	if (Array.isArray(value)) return "array";
	if (value instanceof Namespace) return value.name;
	if (value instanceof Lambda) return "function";
	if (typeof value === "object") {
		const ctor = Object.getPrototypeOf(value)?.constructor?.name;
		return ctor && ctor !== "Object" ? ctor : "object";
	}
	return typeof value;
};

// Typed explicitly, so a bare `reject(...)` statement narrows like a `throw`.
export const reject: (message: string) => never = (message) => {
	throw new ExpressionError(message);
};

// A runtime fault: the expression was fine, the values were not.
export const fail: (message: string, cause?: unknown) => never = (message, cause) => {
	throw new ExpressionError(message, "expression-runtime", cause);
};

// A built-in's own throw (RangeError, URIError) is a runtime fault, never raw.
export const runtimeFault = (what: string, err: unknown): never => {
	if (ExpressionError.is(err)) throw err;
	return fail(`${what} failed: ${err instanceof Error ? err.message : String(err)}`, err);
};

// Null-prototype: a plain literal would make `toString` look like an entry.
export const table = <T>(entries: Record<string, T>): Record<string, T> =>
	Object.assign(Object.create(null) as Record<string, T>, entries);

// Plain data only, the same gate a direct read applies.
export const plainData = (value: unknown, where: string): object => {
	if (typeof value === "object" && value !== null && (isPlainObject(value) || Array.isArray(value))) return value;
	return reject(`${where} needs plain data, got ${typeName(value)}`);
};

// `f` is the argument the validator reserved for a callback, but a context value can sit there too.
// Checked before the first element as well, so an empty array refuses a non-function, as in JS.
export const checkCallback = (f: unknown): void => {
	if (f instanceof Lambda) return;
	if (f instanceof Namespace) fail(globalCallbackMessage(f.name));
	fail(`Expected a function here, got ${typeName(f)}`);
};

// The budget is charged inside Lambda.call, by the callback's compiled node count.
// Only the first two arguments can carry an element; the rest are an index or the array.
export const invoke = (f: unknown, a?: unknown, b?: unknown, c?: unknown, d?: unknown): unknown => {
	if (!(f instanceof Lambda)) return checkCallback(f);
	if (typeof a === "function" || typeof b === "function") {
		return reject("A callback's argument holds a function, which cannot be read in an expression");
	}
	return f.call(a, b, c, d);
};
