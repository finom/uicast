import { MATH_CONSTANTS, NUMBER_CONSTANTS } from "../constants/globals";
import { MAX_DATA_DEPTH, PRICES } from "../constants/limits";
import { ExpressionError } from "../errors";
import type { Budget } from "./budget";
import { chargeDateText } from "./coerce";
import { methodsOf } from "./methods";
import { fail, isPlainObject, Namespace, plainData, reject, runtimeFault, typeName } from "./values";

// Own properties only, data only, methods called in place: nothing inherited is reachable, so no name is refused by name.

const ignore = (): void => {};

// A bulk copy can carry a function past the per-read gate, so the whole value is walked.
// Only JSON-shaped data leaves: a Date or a Set is for computing inside the expression.
// A promise may be the whole result, never a part of one and never an argument: nothing would await it.
export const assertData = (value: unknown, where: string, wholePromise = false): void => {
	let seen: Set<object> | null = null; // allocated only once nesting appears
	let promise = false;
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
		} else if (v instanceof Promise) {
			if (depth === 0 && wholePromise) return;
			promise = true;
			// It has already started; this keeps a later rejection from going unhandled.
			Promise.prototype.then.call(v, undefined, ignore);
		} else if (v instanceof Date) {
			reject(`${where} contains a Date, which is not plain data — pass date.toISOString() or date.getTime()`);
		} else if (v instanceof Set) {
			reject(`${where} contains a Set, which is not plain data — spread it into an array: [...set]`);
		} else {
			reject(`${where} contains a ${typeName(v)}, which is not plain data`);
		}
	};
	try {
		walk(value, 0);
	} catch (err) {
		if (ExpressionError.is(err)) throw err;
		reject(`${where} could not be checked: ${err instanceof Error ? err.message : String(err)}`);
	}
	if (promise) {
		reject(
			wholePromise
				? `${where} holds a promise inside an array or object — only the whole result may be one`
				: `${where} holds a promise: a host function's result cannot be passed on within the same expression`,
		);
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

// Never a function, which could be handed to a host function.
const noFunction = (value: unknown, key: string | number): unknown =>
	typeof value === "function" ? reject(`"${key}" holds a function, which cannot be read in an expression`) : value;

// No tick: the read is a compiled node, charged up front.
export const getMember = (obj: unknown, rawKey: unknown): unknown => read(obj, asKey(rawKey));

// The hottest path in the package, so the plain-object case is inlined.
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
		return fail(`Cannot read "${key}" of ${obj === null ? "null" : "undefined"}`);
	}

	if (typeof obj === "string" || Array.isArray(obj)) {
		if (key === "length") return obj.length;
		const index = arrayIndex(key);
		if (index !== null) return noFunction(obj[index], key);
		// A numeric key that is not an index is an absent property in JS, not an error.
		if (typeof key === "number") return undefined;
		return reject(`"${key}" is not readable on ${typeName(obj)} — call it as a method`);
	}

	if (obj instanceof Namespace) {
		if (obj.name === "Math" && key in MATH_CONSTANTS) return MATH_CONSTANTS[key];
		if (obj.name === "Number" && key in NUMBER_CONSTANTS) return NUMBER_CONSTANTS[key];
		return reject(`"${obj.name}.${key}" is not available`);
	}

	if (obj instanceof Set) {
		if (key === "size") return obj.size;
		return reject(`"${key}" is not readable on a ${typeName(obj)}`);
	}

	if (typeof obj === "object" && isPlainObject(obj)) {
		return Object.hasOwn(obj, key) ? noFunction((obj as Record<string | number, unknown>)[key], key) : undefined;
	}

	// A live object would let the expression walk a graph one innocent key at a time.
	return reject(`"${key}" is not readable on ${typeName(obj)}`);
};

export const chargeResult = (value: unknown, what: string, budget: Budget): unknown => {
	if (typeof value === "function") return reject(`"${what}" returned a function, which cannot be read in an expression`);
	if (typeof value === "string") budget.string(value.length);
	else if (Array.isArray(value)) budget.array(value.length);
	else if (value instanceof Set) budget.array(value.size);
	return value;
};

// The only way a method is ever reached.
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
	budget.tick(PRICES.call);
	try {
		return chargeResult(impl(obj as never, args, budget), key, budget);
	} catch (err) {
		return runtimeFault(`${key}()`, err);
	}
};

export const construct = (callee: unknown, args: unknown[], budget: Budget): unknown => {
	budget.tick(PRICES.construct);
	if (!(callee instanceof Namespace)) {
		return reject(`"new" is only available for Date and Set`);
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
			for (const arg of args) chargeDateText(arg, budget);
			return Reflect.construct(Date, args);
		case "Set": {
			const [source] = args;
			const size = source === undefined || source === null ? 0 : iterableSize(source);
			// Anything else would be iterated by the engine, uncharged.
			if (size === null) return reject("new Set needs an array, a string or a Set");
			budget.array(size);
			budget.tick(PRICES.hash * size);
			return new Set(source as Iterable<unknown> | null | undefined);
		}
		default:
			return reject(`"new ${name}" is not available`);
	}
};

// A computed `__proto__` key becomes an own key, as in JS.
export const defineKey = (target: Record<string, unknown>, rawKey: unknown, value: unknown): void => {
	Object.defineProperty(target, String(asKey(rawKey)), { value, writable: true, enumerable: true, configurable: true });
};

const iterableSize = (v: unknown): number | null => {
	if (Array.isArray(v) || typeof v === "string") return v.length;
	if (v instanceof Set) return v.size;
	return null;
};

export const pushSpread = (out: unknown[], value: unknown, budget: Budget): void => {
	const size = iterableSize(value);
	if (size === null) reject("Only arrays, strings, and Sets can be spread here");
	budget.growArray(out.length + size, size);
	out.push(...(value as Iterable<unknown>));
};

// The engine copies; only an own `__proto__` key, which assignment would turn into a prototype, is copied by hand.
export const spreadInto = (target: Record<string, unknown>, value: unknown, budget: Budget): void => {
	if (value === null || value === undefined) return;
	const source = plainData(value, "Spread");
	const keys = Object.keys(source);
	budget.tick(keys.length);
	if (!Object.hasOwn(source, "__proto__")) {
		Object.assign(target, source);
		return;
	}
	for (const key of keys) defineKey(target, key, (source as Record<string, unknown>)[key]);
};
