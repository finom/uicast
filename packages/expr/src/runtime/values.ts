import { OBJECT_NAMESPACES } from "../constants/globals";
import { ExpressionError } from "../errors";

// The value kinds an expression can hold besides plain data, and the helpers every layer shares.

// A function literal. Not a real JS function: five positional slots (MAX_ARROW_PARAMS), no arguments array per call. The method tables fill at most four.
export type LambdaCall = (a?: unknown, b?: unknown, c?: unknown, d?: unknown, e?: unknown) => unknown;

export class Lambda {
	constructor(readonly call: LambdaCall) {}
}

// A bound host function: input validated, output validated, errors classified. The validator lets its name appear only as a callee, so it is never a value.
export type HostFunction = (input: unknown) => unknown;

// An allow-listed global (`Math`, `Date`, `Intl.NumberFormat`, …). Reads and calls on it go through the tables.
export class Namespace {
	constructor(readonly name: string) {}
}

// An Intl formatter — the one built-in that legitimately holds a method.
export class Formatter {
	constructor(readonly format: (value: never) => string) {}
}

// `typeof`, answered the way JS answers it for the kinds above.
export const typeOf = (value: unknown): string => {
	if (value instanceof Lambda) return "function";
	if (value instanceof Namespace) return OBJECT_NAMESPACES.has(value.name) ? "object" : "function";
	return typeof value;
};

export const isPlainObject = (value: object): boolean => {
	const proto = Object.getPrototypeOf(value);
	return proto === Object.prototype || proto === null;
};

// For messages.
export const typeName = (value: unknown): string => {
	if (value === null) return "null";
	if (Array.isArray(value)) return "array";
	if (value instanceof Lambda) return "function";
	if (typeof value === "object") {
		const ctor = Object.getPrototypeOf(value)?.constructor?.name;
		return ctor && ctor !== "Object" ? ctor : "object";
	}
	return typeof value;
};

// A policy rejection: the expression asked for something the language refuses.
export const reject = (message: string): never => {
	throw new ExpressionError(message);
};

// A runtime fault: the expression was fine, the values were not.
export const fail = (message: string, cause?: unknown): never => {
	throw new ExpressionError(message, "runtime", cause);
};

// What a built-in throws on its own (RangeError, URIError) is a runtime fault, never raw.
export const runtimeFault = (what: string, err: unknown): never => {
	if (ExpressionError.is(err)) throw err;
	return fail(`${what} failed: ${err instanceof Error ? err.message : String(err)}`, err);
};

export const num = (v: unknown): number => (typeof v === "number" ? v : Number(v));

// A null-prototype table: read by key from expression input, a plain literal would make `toString` look like an entry.
export const table = <T>(entries: Record<string, T>): Record<string, T> =>
	Object.assign(Object.create(null) as Record<string, T>, entries);

// The receiver rule for a bulk read (`Object.keys`, spread): plain data only, the same gate a direct read applies.
export const plainData = (value: unknown, where: string): object => {
	if (value === null || value === undefined) return {};
	if (typeof value !== "object" || (!isPlainObject(value) && !Array.isArray(value))) {
		return reject(`${where} needs plain data, got ${typeName(value)}`);
	}
	return value;
};

// Call a function literal. The budget is charged inside Lambda.call, by the callback's compiled node count.
export const invoke = (f: unknown, a?: unknown, b?: unknown, c?: unknown, d?: unknown): unknown => {
	if (f instanceof Lambda) return f.call(a, b, c, d);
	return fail(`Expected a function here, got ${typeName(f)}`);
};
