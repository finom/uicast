import type { Budget } from "./budget";
import { ExpressionError } from "./errors";
import { FORBIDDEN_KEYS } from "./grammar";

// Every read and call passes through here with its key already a resolved
// string — a computed name gets the same rejection as a written one. Own
// properties only, data only, methods invoked in place.

/** A function literal — deliberately not a real JS function. Positional args (four slots cover every table callback); an array per call was one allocation per element. */
export class Lambda {
	constructor(
		readonly call: (a?: unknown, b?: unknown, c?: unknown, d?: unknown) => unknown,
	) {}
}

/** A host function exposed to the expression by name. */
export class HostFn {
	constructor(
		readonly name: string,
		readonly fn: (input: unknown) => unknown,
	) {}
}

/** An allow-listed global namespace (`Math`, `JSON`, `Intl.NumberFormat`, …). */
export class Namespace {
	constructor(readonly name: string) {}
}

/** An `Intl` formatter — the one built-in that legitimately holds a method. */
export class Formatter {
	constructor(readonly format: (value: never) => string) {}
}

const isPlainObject = (value: object): boolean => {
	const proto = Object.getPrototypeOf(value);
	return proto === Object.prototype || proto === null;
};

const typeName = (value: unknown): string => {
	if (value === null) return "null";
	if (Array.isArray(value)) return "array";
	if (value instanceof Lambda) return "function";
	if (value instanceof HostFn) return "host function";
	if (value instanceof Date) return "Date";
	if (value instanceof Map) return "Map";
	if (value instanceof Set) return "Set";
	if (value instanceof URL) return "URL";
	if (typeof value === "object") {
		const ctor = Object.getPrototypeOf(value)?.constructor?.name;
		return ctor && ctor !== "Object" ? ctor : "object";
	}
	return typeof value;
};

/** A policy rejection: the expression asked for something the language refuses. */
const reject = (message: string): never => {
	throw new ExpressionError(message);
};

/** A runtime fault: the expression was fine, the values were not. */
const fail = (message: string): never => {
	throw new ExpressionError(message, "runtime");
};

const asKey = (key: unknown): string | number => {
	if (typeof key === "number") return key;
	if (typeof key === "string") return key;
	if (typeof key === "symbol") {
		return reject("A symbol cannot be used as a property key here");
	}
	if (key === null || key === undefined || typeof key === "object") {
		return reject(`A ${typeName(key)} cannot be used as a property key`);
	}
	return String(key);
};

const arrayIndex = (key: string | number): number | null => {
	if (typeof key === "number") return Number.isInteger(key) && key >= 0 ? key : null;
	if (!/^\d+$/.test(key)) return null;
	return Number(key);
};

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

const URL_PROPS = new Set([
	"href", "protocol", "host", "hostname", "port",
	"pathname", "search", "hash", "origin",
]);

const MATH_CONSTANTS: Record<string, number> = {
	PI: Math.PI, E: Math.E, LN2: Math.LN2, LN10: Math.LN10,
	LOG2E: Math.LOG2E, LOG10E: Math.LOG10E, SQRT1_2: Math.SQRT1_2, SQRT2: Math.SQRT2,
};

const NUMBER_CONSTANTS: Record<string, number> = {
	MAX_SAFE_INTEGER: Number.MAX_SAFE_INTEGER,
	MIN_SAFE_INTEGER: Number.MIN_SAFE_INTEGER,
	MAX_VALUE: Number.MAX_VALUE,
	MIN_VALUE: Number.MIN_VALUE,
	EPSILON: Number.EPSILON,
	POSITIVE_INFINITY: Number.POSITIVE_INFINITY,
	NEGATIVE_INFINITY: Number.NEGATIVE_INFINITY,
	NaN: Number.NaN,
};

/** Namespaces reachable as a property of another namespace. */
const NESTED_NAMESPACES: Record<string, ReadonlySet<string>> = {
	Intl: new Set(["NumberFormat", "DateTimeFormat"]),
};

/**
 * Read `obj[key]`. Returns data only — a method name resolves to a rejection,
 * because a method that could be read could be passed somewhere and re-bound.
 */
export const getMember = (obj: unknown, rawKey: unknown, budget: Budget): unknown => {
	// No tick: the read is a compiled node, charged by the compiler up front.
	const key = asKey(rawKey);

	if (typeof key === "string" && FORBIDDEN_KEYS.has(key)) {
		return reject(`Access to "${key}" is not allowed`);
	}

	return read(obj, key, budget);
};

/** `obj.key` with a source-level identifier key: coercion and forbidden-name check are provably redundant here (parser + validator already ran) — the hottest path earns the second entry point. */
export const getStaticMember = (obj: unknown, key: string, budget: Budget): unknown => {
	// The common case, inlined: a plain object read by own property.
	if (obj !== null && typeof obj === "object" && !Array.isArray(obj)) {
		const proto = Object.getPrototypeOf(obj);
		if (proto === Object.prototype || proto === null) {
			if (!Object.hasOwn(obj, key)) return undefined;
			const value = (obj as Record<string, unknown>)[key];
			if (typeof value === "function") {
				return reject(`"${key}" holds a function, which cannot be read in an expression`);
			}
			return value;
		}
	}
	return read(obj, key, budget);
};

const read = (obj: unknown, key: string | number, _budget: Budget): unknown => {
	if (obj === null || obj === undefined) {
		return fail(`Cannot read "${String(key)}" of ${obj === null ? "null" : "undefined"}`);
	}

	if (typeof obj === "string") {
		if (key === "length") return obj.length;
		const index = arrayIndex(key);
		if (index !== null) return obj[index];
		// arr[-1] / arr[1.5] are absent properties in JS, not errors.
		if (typeof key === "number") return undefined;
		return reject(`"${String(key)}" is not readable on a string — call it as a method`);
	}

	if (typeof obj === "number" || typeof obj === "boolean") {
		return reject(`"${String(key)}" is not readable on a ${typeof obj}`);
	}

	if (Array.isArray(obj)) {
		if (key === "length") return obj.length;
		const index = arrayIndex(key);
		if (index !== null) {
			const value = obj[index];
			if (typeof value === "function") {
				return reject(`"${String(key)}" holds a function, which cannot be read in an expression`);
			}
			return value;
		}
		if (typeof key === "number") return undefined;
		return reject(`"${String(key)}" is not readable on an array — call it as a method`);
	}

	if (obj instanceof Namespace) {
		if (obj.name === "Math" && key in MATH_CONSTANTS) return MATH_CONSTANTS[key as string];
		if (obj.name === "Number" && key in NUMBER_CONSTANTS) {
			return NUMBER_CONSTANTS[key as string];
		}
		const nested = NESTED_NAMESPACES[obj.name];
		if (nested?.has(String(key))) return new Namespace(`${obj.name}.${String(key)}`);
		return reject(`"${obj.name}.${String(key)}" is not available`);
	}

	if (obj instanceof Map || obj instanceof Set) {
		if (key === "size") return obj.size;
		return reject(`"${String(key)}" is not readable on a ${typeName(obj)}`);
	}

	if (obj instanceof URL) {
		if (typeof key === "string" && URL_PROPS.has(key)) {
			return (obj as unknown as Record<string, unknown>)[key];
		}
		return reject(`"${String(key)}" is not readable on a URL`);
	}

	if (obj instanceof Date || obj instanceof Lambda || obj instanceof HostFn || obj instanceof Formatter) {
		return reject(`"${String(key)}" is not readable on a ${typeName(obj)}`);
	}

	if (typeof obj === "object") {
		if (!isPlainObject(obj)) {
			// The value gate. A class instance or a host object would let the
			// expression walk a live graph one innocent key at a time.
			return reject(
				`Values of type ${typeName(obj)} cannot be read in an expression — only plain data`,
			);
		}
		// Own properties only: nothing inherited is reachable, named or not.
		if (!Object.hasOwn(obj, key as string)) return undefined;
		const value = (obj as Record<string | number, unknown>)[key];
		// A raw function reached through plain data is inert here — it is not a
		// Lambda, so it cannot be called — but it could still be handed to a host
		// function that calls it. Refuse it at the read instead.
		if (typeof value === "function") {
			return reject(`"${String(key)}" holds a function, which cannot be read in an expression`);
		}
		return value;
	}

	return reject(`Values of type ${typeof obj} cannot be read in an expression`);
};

// ---------------------------------------------------------------------------
// Calls
// ---------------------------------------------------------------------------

const invoke = (
	f: unknown,
	a?: unknown,
	b?: unknown,
	c?: unknown,
	d?: unknown,
): unknown => {
	// The budget is charged inside Lambda.call, by the callback's compiled node
	// count — exact accounting for one tick instead of one per node.
	if (f instanceof Lambda) return f.call(a, b, c, d);
	return fail(`Expected a function here, got ${typeName(f)}`);
};

const num = (v: unknown): number => (typeof v === "number" ? v : Number(v));

/** Scalar results pass the same function gate as a read. */
const noFn = (value: unknown, method: string): unknown => {
	if (typeof value === "function") {
		return reject(`"${method}" returned a function, which cannot be read in an expression`);
	}
	return value;
};

const requireString = (v: unknown, method: string): string => {
	if (typeof v === "string") return v;
	return fail(`"${method}" needs a string argument here — regular expressions are not available`);
};

type MethodImpl = (recv: never, args: unknown[], budget: Budget) => unknown;

/** Implemented here, not delegated: the budget ticks inside every iteration, no real function ever reaches a built-in, and mutating methods do not exist. */
const ARRAY_METHODS: Record<string, MethodImpl> = {
	map: (a: unknown[], [f], b) => {
		// No per-iteration tick here or below: each `invoke` charges the
		// callback's full compile-time cost, which is never less than one.
		b.array(a.length);
		const out: unknown[] = [];
		for (let i = 0; i < a.length; i++) {
			out.push(invoke(f, a[i], i, a));
		}
		return out;
	},
	filter: (a: unknown[], [f], b) => {
		const out: unknown[] = [];
		for (let i = 0; i < a.length; i++) {
			if (invoke(f, a[i], i, a)) out.push(a[i]);
		}
		b.array(out.length);
		return out;
	},
	forEach: (a: unknown[], [f], _b) => {
		for (let i = 0; i < a.length; i++) {
			invoke(f, a[i], i, a);
		}
		return undefined;
	},
	reduce: (a: unknown[], args, _b) => {
		const [f] = args;
		let acc: unknown;
		let start = 0;
		if (args.length >= 2) acc = args[1];
		else {
			if (a.length === 0) return fail("reduce of an empty array with no initial value");
			acc = a[0];
			start = 1;
		}
		for (let i = start; i < a.length; i++) {
			acc = invoke(f, acc, a[i], i, a);
		}
		return acc;
	},
	reduceRight: (a: unknown[], args, _b) => {
		const [f] = args;
		let acc: unknown;
		let start = a.length - 1;
		if (args.length >= 2) acc = args[1];
		else {
			if (a.length === 0) return fail("reduceRight of an empty array with no initial value");
			acc = a[start];
			start -= 1;
		}
		for (let i = start; i >= 0; i--) {
			acc = invoke(f, acc, a[i], i, a);
		}
		return acc;
	},
	find: (a: unknown[], [f], _b) => {
		for (let i = 0; i < a.length; i++) {
			if (invoke(f, a[i], i, a)) return noFn(a[i], "find");
		}
		return undefined;
	},
	findIndex: (a: unknown[], [f], _b) => {
		for (let i = 0; i < a.length; i++) {
			if (invoke(f, a[i], i, a)) return i;
		}
		return -1;
	},
	findLast: (a: unknown[], [f], _b) => {
		for (let i = a.length - 1; i >= 0; i--) {
			if (invoke(f, a[i], i, a)) return noFn(a[i], "findLast");
		}
		return undefined;
	},
	findLastIndex: (a: unknown[], [f], _b) => {
		for (let i = a.length - 1; i >= 0; i--) {
			if (invoke(f, a[i], i, a)) return i;
		}
		return -1;
	},
	some: (a: unknown[], [f], _b) => {
		for (let i = 0; i < a.length; i++) {
			if (invoke(f, a[i], i, a)) return true;
		}
		return false;
	},
	every: (a: unknown[], [f], _b) => {
		for (let i = 0; i < a.length; i++) {
			if (!invoke(f, a[i], i, a)) return false;
		}
		return true;
	},
	slice: (a: unknown[], [s, e], b) => {
		const out = a.slice(s as number | undefined, e as number | undefined);
		// Charged by what it produces, not a flat cost: an unbilled slice is a
		// cheap call that allocates the whole array, and a few thousand of them
		// are half a gigabyte.
		b.array(out.length);
		return out;
	},
	join: (a: unknown[], [sep], b) => {
		const separator = sep === undefined ? "," : String(sep);
		b.string(a.length * (separator.length + 8));
		const out = a.map((v) => (v === null || v === undefined ? "" : String(v))).join(separator);
		b.string(out.length);
		return out;
	},
	includes: (a: unknown[], [v], b) => {
		b.tick(a.length);
		return a.includes(v);
	},
	indexOf: (a: unknown[], [v], b) => {
		b.tick(a.length);
		return a.indexOf(v);
	},
	lastIndexOf: (a: unknown[], [v], b) => {
		b.tick(a.length);
		return a.lastIndexOf(v);
	},
	at: (a: unknown[], [i], b) => {
		b.tick(1);
		return noFn(a.at(num(i)), "at");
	},
	flat: (a: unknown[], [depth], b) => {
		b.array(a.length);
		const out = a.flat(depth === undefined ? 1 : num(depth));
		// Flattening can produce more than it consumed.
		b.array(out.length);
		return out;
	},
	flatMap: (a: unknown[], [f], b) => {
		const out: unknown[] = [];
		for (let i = 0; i < a.length; i++) {
			const v = invoke(f, a[i], i, a);
			const delta = Array.isArray(v) ? v.length : 1;
			b.growArray(out.length + delta, delta);
			if (Array.isArray(v)) out.push(...v);
			else out.push(v);
		}
		return out;
	},
	// The standard non-mutating pair; the mutating sort/reverse are not in the language.
	toSorted: (a: unknown[], [f], b) => {
		b.array(a.length);
		b.tick(a.length * 2);
		const copy = a.slice();
		if (f === undefined) return copy.sort();
		return copy.sort((x, y) => {
			b.tick(1);
			return num(invoke(f, x, y));
		});
	},
	toReversed: (a: unknown[], _args, b) => {
		b.array(a.length);
		return a.slice().reverse();
	},
};

const STRING_METHODS: Record<string, MethodImpl> = {
	at: (s: string, [i], b) => {
		b.tick(1);
		return s.at(num(i));
	},
	endsWith: (s: string, [v], b) => {
		b.tick(1);
		return s.endsWith(String(v));
	},
	startsWith: (s: string, [v, p], b) => {
		b.tick(1);
		return s.startsWith(String(v), p === undefined ? undefined : num(p));
	},
	includes: (s: string, [v], b) => {
		b.tick(1);
		return s.includes(String(v));
	},
	indexOf: (s: string, [v], b) => {
		b.tick(1);
		return s.indexOf(String(v));
	},
	lastIndexOf: (s: string, [v], b) => {
		b.tick(1);
		return s.lastIndexOf(String(v));
	},
	normalize: (s: string, [form], b) => {
		b.tick(1);
		return s.normalize(form === undefined ? undefined : String(form));
	},
	padStart: (s: string, [n, p], b) => {
		const target = num(n);
		b.string(target);
		return s.padStart(target, p === undefined ? undefined : String(p));
	},
	padEnd: (s: string, [n, p], b) => {
		const target = num(n);
		b.string(target);
		return s.padEnd(target, p === undefined ? undefined : String(p));
	},
	repeat: (s: string, [n], b) => {
		const count = num(n);
		if (!Number.isFinite(count) || count < 0) {
			return fail(`repeat count ${String(n)} is not valid`);
		}
		b.string(s.length * count);
		return s.repeat(count);
	},
	// String patterns only. A regular expression would put ReDoS inside the
	// regex engine, where no step counter can see it.
	replace: (s: string, [from, to], b) => {
		b.string(s.length + String(to ?? "").length);
		return s.replace(requireString(from, "replace"), String(to ?? ""));
	},
	replaceAll: (s: string, [from, to], b) => {
		b.string(s.length * 2);
		return s.replaceAll(requireString(from, "replaceAll"), String(to ?? ""));
	},
	slice: (s: string, [a, c], b) => {
		b.tick(1);
		return s.slice(a as number | undefined, c as number | undefined);
	},
	substring: (s: string, [a, c], b) => {
		b.tick(1);
		return s.substring(a === undefined ? 0 : num(a), c === undefined ? undefined : num(c));
	},
	split: (s: string, [sep, limit], b) => {
		const parts =
			sep === undefined
				? [s]
				: s.split(requireString(sep, "split"), limit === undefined ? undefined : num(limit));
		b.array(parts.length);
		return parts;
	},
	toLowerCase: (s: string, _a, b) => {
		b.string(s.length);
		return s.toLowerCase();
	},
	toUpperCase: (s: string, _a, b) => {
		b.string(s.length);
		return s.toUpperCase();
	},
	trim: (s: string, _a, b) => {
		b.tick(1);
		return s.trim();
	},
	trimStart: (s: string, _a, b) => {
		b.tick(1);
		return s.trimStart();
	},
	trimEnd: (s: string, _a, b) => {
		b.tick(1);
		return s.trimEnd();
	},
	localeCompare: (s: string, [v], b) => {
		b.tick(1);
		return s.localeCompare(String(v));
	},
};

const NUMBER_METHODS: Record<string, MethodImpl> = {
	toFixed: (n: number, [d], b) => {
		b.tick(1);
		return n.toFixed(d === undefined ? undefined : num(d));
	},
	// `toString` and `toLocaleString` collide with Object.prototype's members, so
	// the object literal loses contextual typing on them — annotate explicitly.
	toString: ((n: number, args: unknown[], b: Budget) => {
		b.tick(1);
		return n.toString(args[0] === undefined ? undefined : num(args[0]));
	}) as MethodImpl,
	toLocaleString: ((n: number, args: unknown[], b: Budget) => {
		b.tick(8);
		return n.toLocaleString(
			args[0] as string | undefined,
			args[1] as Intl.NumberFormatOptions | undefined,
		);
	}) as MethodImpl,
};

const DATE_METHODS: Record<string, MethodImpl> = Object.fromEntries(
	[
		"getTime", "getFullYear", "getMonth", "getDate", "getDay", "getHours",
		"getMinutes", "getSeconds", "getMilliseconds", "getTimezoneOffset",
		"getUTCFullYear", "getUTCMonth", "getUTCDate", "getUTCDay", "getUTCHours",
		"getUTCMinutes", "getUTCSeconds", "valueOf",
		"toISOString", "toJSON", "toDateString", "toTimeString",
		"toLocaleDateString", "toLocaleTimeString", "toLocaleString",
	].map((name) => [
		name,
		((d: Date, args: unknown[], b: Budget) => {
			b.tick(8);
			const fn = (d as unknown as Record<string, (...a: unknown[]) => unknown>)[name];
			return fn.apply(d, args.slice(0, 2));
		}) as MethodImpl,
	]),
);

const MAP_METHODS: Record<string, MethodImpl> = {
	get: (m: Map<unknown, unknown>, [k], b) => {
		b.tick(1);
		const value = m.get(k);
		if (typeof value === "function") {
			return reject(`"get" returned a function, which cannot be read in an expression`);
		}
		return value;
	},
	has: (m: Map<unknown, unknown>, [k], b) => {
		b.tick(1);
		return m.has(k);
	},
	keys: (m: Map<unknown, unknown>, _a, b) => {
		b.array(m.size);
		return [...m.keys()];
	},
	values: (m: Map<unknown, unknown>, _a, b) => {
		b.array(m.size);
		return [...m.values()];
	},
	entries: (m: Map<unknown, unknown>, _a, b) => {
		b.array(m.size);
		return [...m.entries()];
	},
};

const SET_METHODS: Record<string, MethodImpl> = {
	has: (s: Set<unknown>, [v], b) => {
		b.tick(1);
		return s.has(v);
	},
	values: (s: Set<unknown>, _a, b) => {
		b.array(s.size);
		return [...s.values()];
	},
};

const FORMATTER_METHODS: Record<string, MethodImpl> = {
	format: (f: Formatter, [v], b) => {
		b.tick(8);
		return f.format(v as never);
	},
};

/** Static members of the allow-listed namespaces. */
const NAMESPACE_METHODS: Record<string, Record<string, MethodImpl>> = {
	Math: Object.fromEntries(
		[
			"abs", "ceil", "floor", "round", "trunc", "sign", "sqrt", "cbrt",
			"pow", "min", "max", "hypot", "log", "log2", "log10", "log1p",
			"exp", "expm1", "sin", "cos", "tan", "asin", "acos", "atan", "atan2",
			"sinh", "cosh", "tanh", "fround", "clz32", "imul",
		].map((name) => [
			name,
			((_r: never, args: unknown[], b: Budget) => {
				b.tick(1);
				return (Math as unknown as Record<string, (...a: unknown[]) => unknown>)[name](
					...args,
				);
			}) as MethodImpl,
		]),
	),
	JSON: {
		parse: (_r, [text], b) => {
			const source = String(text);
			b.string(source.length);
			b.tick(Math.ceil(source.length / 64));
			try {
				return JSON.parse(source);
			} catch (err) {
				return fail(`JSON.parse failed: ${(err as Error).message}`);
			}
		},
		stringify: (_r, [value, _replacer, space], b) => {
			// The replacer is dropped on purpose: it would take a function, and a
			// function argument here has no use a document needs.
			const out = JSON.stringify(
				value,
				null,
				space === undefined ? undefined : (space as string | number),
			);
			if (out === undefined) return undefined;
			b.string(out.length);
			return out;
		},
	},
	Object: {
		keys: (_r, [o], b) => {
			const keys = Object.keys((o ?? {}) as object);
			b.array(keys.length);
			return keys;
		},
		values: (_r, [o], b) => {
			const values = Object.values((o ?? {}) as object);
			b.array(values.length);
			return values;
		},
		entries: (_r, [o], b) => {
			const entries = Object.entries((o ?? {}) as object);
			b.array(entries.length);
			return entries;
		},
		fromEntries: (_r, [pairs], b) => {
			const list = pairs as [unknown, unknown][];
			b.array(Array.isArray(list) ? list.length : 0);
			const out: Record<string, unknown> = {};
			for (const [k, v] of list) {
				const key = String(k);
				if (FORBIDDEN_KEYS.has(key)) {
					return reject(`Object.fromEntries cannot set "${key}"`);
				}
				Object.defineProperty(out, key, {
					value: v,
					writable: true,
					enumerable: true,
					configurable: true,
				});
			}
			return out;
		},
	},
	Array: {
		isArray: (_r, [v], b) => {
		b.tick(1);
		return Array.isArray(v);
	},
		from: (_r, [source, mapper], b) => {
			let base: unknown[];
			if (Array.isArray(source)) base = source;
			else if (typeof source === "string") base = [...source];
			else if (source instanceof Set || source instanceof Map) base = [...source];
			else if (source && typeof source === "object" && "length" in source) {
				const length = num((source as { length: unknown }).length);
				b.array(length);
				base = new Array(length).fill(undefined);
			} else {
				return fail("Array.from needs an array, string, Set, Map, or {length}");
			}
			b.array(base.length);
			if (mapper === undefined) return [...base];
			return base.map((v, i) => {
				b.tick(1);
				return invoke(mapper, v, i);
			});
		},
	},
	Number: {
		isInteger: (_r, [v], b) => {
		b.tick(1);
		return Number.isInteger(v);
	},
		isFinite: (_r, [v], b) => {
		b.tick(1);
		return Number.isFinite(v);
	},
		isNaN: (_r, [v], b) => {
		b.tick(1);
		return Number.isNaN(v);
	},
		isSafeInteger: (_r, [v], b) => {
		b.tick(1);
		return Number.isSafeInteger(v);
	},
		parseFloat: (_r, [v], b) => {
		b.tick(1);
		return Number.parseFloat(String(v));
	},
		parseInt: (_r, [v, radix], b) => {
		b.tick(1);
		return Number.parseInt(String(v), radix === undefined ? undefined : num(radix));
	},
	},
	Date: {
		now: (_r, _args, b) => {
		b.tick(1);
		return Date.now();
	},
		UTC: (_r, args, b) => {
		b.tick(1);
		return Date.UTC(...(args.map(num) as [number]));
	},
	},
};

/** Call `obj[key](...args)`. The only way a method is ever reached. */
export const callMember = (
	obj: unknown,
	rawKey: unknown,
	args: unknown[],
	budget: Budget,
): unknown => {
	const key = String(asKey(rawKey));

	if (FORBIDDEN_KEYS.has(key)) return reject(`Access to "${key}" is not allowed`);
	if (obj === null || obj === undefined) {
		return fail(`Cannot call "${key}" of ${obj === null ? "null" : "undefined"}`);
	}

	let table: Record<string, MethodImpl> | undefined;
	if (typeof obj === "string") table = STRING_METHODS;
	else if (typeof obj === "number") table = NUMBER_METHODS;
	else if (Array.isArray(obj)) table = ARRAY_METHODS;
	else if (obj instanceof Namespace) table = NAMESPACE_METHODS[obj.name];
	else if (obj instanceof Date) table = DATE_METHODS;
	else if (obj instanceof Map) table = MAP_METHODS;
	else if (obj instanceof Set) table = SET_METHODS;
	else if (obj instanceof Formatter) table = FORMATTER_METHODS;

	const impl = table?.[key];
	if (!impl) {
		const where = obj instanceof Namespace ? obj.name : typeName(obj);
		return reject(`"${key}" is not an available method on ${where}`);
	}
	return impl(obj as never, args, budget);
};

/** `new X(...)`, for the four constructors the grammar allows. */
export const construct = (callee: unknown, args: unknown[], budget: Budget): unknown => {
	budget.tick(4);
	if (!(callee instanceof Namespace)) {
		return reject(`"new" is only available for Date, Map, Set, URL, and Intl formatters`);
	}
	switch (callee.name) {
		case "Date":
			return args.length === 0
				? new Date()
				: new Date(...(args as unknown as [string | number]));
		case "Map":
			return new Map(args[0] as Iterable<[unknown, unknown]> | undefined);
		case "Set":
			return new Set(args[0] as Iterable<unknown> | undefined);
		case "URL":
			try {
				return new URL(String(args[0]), args[1] === undefined ? undefined : String(args[1]));
			} catch {
				return fail(`"${String(args[0])}" is not a valid URL`);
			}
		case "Intl.NumberFormat": {
			const fmt = new Intl.NumberFormat(
				args[0] as string | undefined,
				args[1] as Intl.NumberFormatOptions | undefined,
			);
			return new Formatter((v) => fmt.format(v as number));
		}
		case "Intl.DateTimeFormat": {
			const fmt = new Intl.DateTimeFormat(
				args[0] as string | undefined,
				args[1] as Intl.DateTimeFormatOptions | undefined,
			);
			return new Formatter((v) => fmt.format(v as Date));
		}
		default:
			return reject(`"new ${callee.name}" is not available`);
	}
};

/** Object-literal assignment that never writes through a computed `__proto__` key. */
export const defineKey = (target: Record<string, unknown>, rawKey: unknown, value: unknown): void => {
	const key = String(asKey(rawKey));
	if (FORBIDDEN_KEYS.has(key)) {
		reject(`An object literal cannot define "${key}"`);
	}
	Object.defineProperty(target, key, {
		value,
		writable: true,
		enumerable: true,
		configurable: true,
	});
};

/** Spread `...value` into an array or argument list. */
export const pushSpread = (out: unknown[], value: unknown, budget: Budget): void => {
	if (Array.isArray(value)) {
		budget.growArray(out.length + value.length, value.length);
		out.push(...value);
		return;
	}
	if (typeof value === "string") {
		budget.growArray(out.length + value.length, value.length);
		out.push(...value);
		return;
	}
	if (value instanceof Set) {
		budget.growArray(out.length + value.size, value.size);
		out.push(...value);
		return;
	}
	reject("Only arrays, strings, and Sets can be spread here");
};

/** Spread `...value` into an object literal — own enumerable keys only. */
export const spreadInto = (
	target: Record<string, unknown>,
	value: unknown,
	budget: Budget,
): void => {
	if (value === null || value === undefined) return;
	if (typeof value !== "object" || (!isPlainObject(value) && !Array.isArray(value))) {
		reject(`Only plain objects and arrays can be spread, got ${typeName(value)}`);
	}
	for (const [k, v] of Object.entries(value as object)) {
		budget.tick(1);
		defineKey(target, k, v);
	}
};

/** Every callable method name; the validator rejects written calls outside it, so both back ends refuse the same set. */
export const NAMESPACE_METHOD_NAMES: Readonly<Record<string, ReadonlySet<string>>> =
	Object.freeze(
		Object.fromEntries(
			Object.entries(NAMESPACE_METHODS).map(([k, t]) => [k, new Set(Object.keys(t))]),
		),
	);

export const ALLOWED_METHOD_NAMES: ReadonlySet<string> = new Set([
	...Object.keys(ARRAY_METHODS),
	...Object.keys(STRING_METHODS),
	...Object.keys(NUMBER_METHODS),
	...Object.keys(DATE_METHODS),
	...Object.keys(MAP_METHODS),
	...Object.keys(SET_METHODS),
	...Object.keys(FORMATTER_METHODS),
	...Object.values(NAMESPACE_METHODS).flatMap((t) => Object.keys(t)),
]);
