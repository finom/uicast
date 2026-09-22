import { MATH_CONSTANTS, NESTED_NAMESPACES, NUMBER_CONSTANTS, URL_PROPS } from "../constants/globals";
import { MAX_DATA_DEPTH } from "../constants/limits";
import { ExpressionError } from "../errors";
import type { Budget } from "./budget";
import { methodsOf } from "./methods";
import { fail, Formatter, isPlainObject, Namespace, plainData, reject, runtimeFault, typeName } from "./values";

// Every read and call arrives here with its key already resolved, so a computed name gets the same answer as a written one.
// Own properties only, data only, methods called in place — nothing inherited is reachable, so no name needs to be refused by name.

// What may leave an expression, as result or host-function argument: plain data and the built-in value types.
// Anything else, however deep, is refused — a bulk copy can carry it past the per-read gate.
export const assertData = (value: unknown, where: string): void => {
	if (typeof value === "function") reject(`${where} contains a function`);
	if (value === null || typeof value !== "object") return;
	let seen: Set<object> | null = null; // allocated only once nesting appears
	// Arrays and plain objects first: they are nearly everything that comes through.
	const walk = (v: unknown, depth: number): void => {
		if (v === null || typeof v !== "object") {
			if (typeof v === "function") reject(`${where} contains a function`);
			return;
		}
		if (depth > MAX_DATA_DEPTH) reject(`${where} is nested deeper than ${MAX_DATA_DEPTH} levels`);
		if (depth > 0) {
			seen ??= new Set([value as object]);
			if (seen.has(v)) return;
			seen.add(v);
		}
		if (Array.isArray(v)) {
			for (const item of v) walk(item, depth + 1);
		} else if (isPlainObject(v)) {
			for (const key of Object.keys(v)) walk((v as Record<string, unknown>)[key], depth + 1);
		} else if (v instanceof Date || v instanceof URL || v instanceof Promise) {
			return;
		} else if (v instanceof Set) {
			for (const item of v) walk(item, depth + 1);
		} else if (v instanceof Map) {
			for (const [k, item] of v) {
				walk(k, depth + 1);
				walk(item, depth + 1);
			}
		} else {
			reject(`${where} contains a ${typeName(v)}, which is not plain data`);
		}
	};
	try {
		walk(value, 0);
	} catch (err) {
		if (ExpressionError.is(err)) throw err;
		reject(`${where} could not be checked: ${(err as Error).message}`);
	}
};

const asKey = (key: unknown): string | number => {
	if (typeof key === "number") return key;
	if (typeof key === "string") return key;
	if (typeof key === "symbol") return reject("A symbol cannot be used as a property key here");
	if (key === null || key === undefined || typeof key === "object") {
		return reject(`A ${typeName(key)} cannot be used as a property key`);
	}
	return String(key);
};

// Only a canonical non-negative integer is an index — `"01"` is not, as in JS.
const arrayIndex = (key: string | number): number | null => {
	if (typeof key === "number") return Number.isInteger(key) && key >= 0 ? key : null;
	const n = Number(key);
	return Number.isInteger(n) && n >= 0 && String(n) === key ? n : null;
};

// Reads

// A value read out of data: never a function, which could be handed to a host function.
const noFunction = (value: unknown, key: string | number): unknown =>
	typeof value === "function" ? reject(`"${String(key)}" holds a function, which cannot be read in an expression`) : value;

// Read `obj[key]`. No tick: the read is a compiled node, charged by the compiler up front.
export const getMember = (obj: unknown, rawKey: unknown): unknown => read(obj, asKey(rawKey));

// `obj.key` with a written identifier key — the hottest path in the package, so the plain-object case is inlined.
export const getStaticMember = (obj: unknown, key: string): unknown => {
	if (obj !== null && typeof obj === "object" && !Array.isArray(obj)) {
		const proto = Object.getPrototypeOf(obj);
		if (proto === Object.prototype || proto === null) {
			if (!Object.hasOwn(obj, key)) return undefined;
			const value = (obj as Record<string, unknown>)[key];
			return typeof value === "function" ? noFunction(value, key) : value;
		}
	}
	return read(obj, key);
};

const read = (obj: unknown, key: string | number): unknown => {
	if (obj === null || obj === undefined) {
		return fail(`Cannot read "${String(key)}" of ${obj === null ? "null" : "undefined"}`);
	}

	if (typeof obj === "string" || Array.isArray(obj)) {
		if (key === "length") return obj.length;
		const index = arrayIndex(key);
		if (index !== null) return noFunction(obj[index], key);
		// A numeric key that is not an index is an absent property in JS, not an error.
		if (typeof key === "number") return undefined;
		return reject(`"${String(key)}" is not readable on ${typeName(obj)} — call it as a method`);
	}

	if (obj instanceof Namespace) {
		if (obj.name === "Math" && key in MATH_CONSTANTS) return MATH_CONSTANTS[key as string];
		if (obj.name === "Number" && key in NUMBER_CONSTANTS) return NUMBER_CONSTANTS[key as string];
		const nested = NESTED_NAMESPACES[obj.name];
		if (nested?.has(String(key))) return new Namespace(`${obj.name}.${String(key)}`);
		return reject(`"${obj.name}.${String(key)}" is not available`);
	}

	if (obj instanceof Map || obj instanceof Set) {
		if (key === "size") return obj.size;
		return reject(`"${String(key)}" is not readable on a ${typeName(obj)}`);
	}

	if (obj instanceof URL) {
		if (typeof key === "string" && URL_PROPS.has(key)) return (obj as unknown as Record<string, unknown>)[key];
		return reject(`"${String(key)}" is not readable on a URL`);
	}

	// Own properties only: nothing inherited is reachable, named or not.
	if (typeof obj === "object" && isPlainObject(obj)) {
		return Object.hasOwn(obj, key as string) ? noFunction((obj as Record<string | number, unknown>)[key], key) : undefined;
	}

	// Primitives, dates, functions and class instances have no readable properties —
	// a live object would let the expression walk a graph one innocent key at a time.
	return reject(`"${String(key)}" is not readable on ${typeName(obj)}`);
};

// Calls

// What a call hands back: never a function, and a string or array charged by its size.
export const chargeResult = (value: unknown, what: string, budget: Budget): unknown => {
	if (typeof value === "function") return reject(`"${what}" returned a function, which cannot be read in an expression`);
	if (typeof value === "string") budget.string(value.length);
	else if (Array.isArray(value)) budget.array(value.length);
	return value;
};

// Call `obj[key](...args)`. The only way a method is ever reached.
export const callMember = (obj: unknown, rawKey: unknown, args: unknown[], budget: Budget): unknown => {
	const key = String(asKey(rawKey));
	if (obj === null || obj === undefined) {
		return fail(`Cannot call "${key}" of ${obj === null ? "null" : "undefined"}`);
	}
	const impl = methodsOf(obj)?.[key];
	if (!impl) {
		const where = obj instanceof Namespace ? obj.name : typeName(obj);
		return reject(`"${key}" is not an available method on ${where}`);
	}
	budget.tick(1);
	try {
		return chargeResult(impl(obj as never, args, budget), key, budget);
	} catch (err) {
		return runtimeFault(`${key}()`, err);
	}
};

// `new X(...)` for Date, Map, Set, URL, and the two Intl formatters.
export const construct = (callee: unknown, args: unknown[], budget: Budget): unknown => {
	budget.tick(4);
	if (!(callee instanceof Namespace)) {
		return reject(`"new" is only available for Date, Map, Set, URL, and Intl formatters`);
	}
	try {
		return constructOne(callee.name, args, budget);
	} catch (err) {
		return runtimeFault(`new ${callee.name}`, err);
	}
};

const constructOne = (name: string, args: unknown[], budget: Budget): unknown => {
	switch (name) {
		case "Date":
			return Reflect.construct(Date, args);
		case "Map":
			budget.array(iterableSize(args[0]) ?? 0);
			return new Map(args[0] as Iterable<[unknown, unknown]> | undefined);
		case "Set":
			budget.array(iterableSize(args[0]) ?? 0);
			return new Set(args[0] as Iterable<unknown> | undefined);
		case "URL":
			try {
				return new URL(String(args[0]), args[1] === undefined ? undefined : String(args[1]));
			} catch {
				return fail(`"${String(args[0])}" is not a valid URL`);
			}
		case "Intl.NumberFormat": {
			const fmt = Reflect.construct(Intl.NumberFormat, args) as Intl.NumberFormat;
			return new Formatter((v) => fmt.format(v as number));
		}
		case "Intl.DateTimeFormat": {
			const fmt = Reflect.construct(Intl.DateTimeFormat, args) as Intl.DateTimeFormat;
			return new Formatter((v) => fmt.format(v as Date));
		}
		default:
			return reject(`"new ${name}" is not available`);
	}
};

// Writes into a literal

// Own-property definition: a computed `__proto__` key becomes an own key, as in JS, never the prototype.
export const defineKey = (target: Record<string, unknown>, rawKey: unknown, value: unknown): void => {
	Object.defineProperty(target, String(asKey(rawKey)), { value, writable: true, enumerable: true, configurable: true });
};

const iterableSize = (v: unknown): number | null =>
	Array.isArray(v) || typeof v === "string" ? v.length : v instanceof Set || v instanceof Map ? v.size : null;

// Spread `...value` into an array or argument list.
export const pushSpread = (out: unknown[], value: unknown, budget: Budget): void => {
	const size = iterableSize(value);
	if (size === null || value instanceof Map) reject("Only arrays, strings, and Sets can be spread here");
	budget.growArray(out.length + size, size);
	out.push(...(value as Iterable<unknown>));
};

// Spread `...value` into an object literal — own enumerable keys only.
export const spreadInto = (target: Record<string, unknown>, value: unknown, budget: Budget): void => {
	if (value === null || value === undefined) return;
	for (const [k, v] of Object.entries(plainData(value, "Spread"))) {
		budget.tick(1);
		defineKey(target, k, v);
	}
};
