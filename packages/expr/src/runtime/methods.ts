import { OBJECT_NAMESPACES } from "../constants/globals";
import { MAX_FLAT_DEPTH } from "../constants/limits";
import { METHOD_NAMES, NAMESPACE_METHOD_NAMES } from "../constants/methods";
import type { Budget } from "./budget";
import { fail, Formatter, invoke, Lambda, Namespace, num, plainData, reject, table } from "./values";

// The implementation behind constants/methods.ts. The membrane charges one step per call and the result's size and refuses a function result;
// a method charges only its own proportional work, and output that can outgrow its input before producing it.

export type MethodImpl = (recv: never, args: unknown[], budget: Budget) => unknown;

const requireString = (v: unknown, method: string): string =>
	typeof v === "string" ? v : fail(`"${method}" needs a string argument here — regular expressions are not available`);

const optNum = (v: unknown): number | undefined => (v === undefined ? undefined : num(v));
const optString = (v: unknown): string | undefined => (v === undefined ? undefined : String(v));

// JS's ToLength: NaN and negatives are 0.
const toLength = (v: unknown): number => {
	const n = Math.trunc(num(v));
	return n > 0 ? Math.min(n, Number.MAX_SAFE_INTEGER) : 0;
};

// Non-overlapping occurrences — what replaceAll replaces and split cuts at.
const occurrences = (s: string, sub: string): number => {
	if (sub === "") return s.length + 1;
	let count = 0;
	for (let i = s.indexOf(sub); i !== -1; i = s.indexOf(sub, i + sub.length)) count++;
	return count;
};

// A replacement string may hold `$&`, `` $` `` and `$'`, each expanding to up to the whole receiver.
const replacementBound = (s: string, to: string): number => to.length + occurrences(to, "$") * s.length;

// The index the callback first answers true for, from either end.
const indexWhere = (a: unknown[], f: unknown, fromEnd: boolean): number => {
	if (fromEnd) {
		for (let i = a.length - 1; i >= 0; i--) if (invoke(f, a[i], i, a)) return i;
	} else {
		for (let i = 0; i < a.length; i++) if (invoke(f, a[i], i, a)) return i;
	}
	return -1;
};

const fold = (a: unknown[], args: unknown[], method: string, fromEnd: boolean): unknown => {
	const [f] = args;
	const step = fromEnd ? -1 : 1;
	let i = fromEnd ? a.length - 1 : 0;
	let acc: unknown;
	if (args.length >= 2) acc = args[1];
	else {
		if (a.length === 0) return fail(`${method} of an empty array with no initial value`);
		acc = a[i];
		i += step;
	}
	for (; i >= 0 && i < a.length; i += step) acc = invoke(f, acc, a[i], i, a);
	return acc;
};

// A table of methods that share one implementation, keyed by name.
const methodTable = (names: Iterable<string>, impl: (name: string) => MethodImpl): Record<string, MethodImpl> =>
	table(Object.fromEntries([...names].map((name) => [name, impl(name)])));

// The engine's own static functions of a namespace, by name from the allow-list.
const nativeTable = (target: object, names: Iterable<string>): Record<string, MethodImpl> =>
	methodTable(names, (name) => {
		const fn = (target as Record<string, (...a: unknown[]) => unknown>)[name];
		return (_r, args) => fn(...args);
	});

// What JS's stringify does to a function or a global: omitted, or `{}` for the object namespaces.
const asJson = (v: unknown): unknown => {
	if (v instanceof Lambda) return undefined;
	if (v instanceof Namespace) return OBJECT_NAMESPACES.has(v.name) ? {} : undefined;
	return v;
};

// JS boxes a primitive receiver; this language refuses it, and null throws in both.
const objectArg = (o: unknown, where: string): object =>
	o === null || o === undefined ? fail(`${where} cannot convert ${String(o)} to an object`) : plainData(o, where);

const ARRAY_METHODS: Record<string, MethodImpl> = table({
	// No per-iteration tick in the callback loops: each `invoke` charges the callback's whole compiled cost, never less than one.
	map: (a: unknown[], [f]) => {
		const out: unknown[] = [];
		for (let i = 0; i < a.length; i++) out.push(invoke(f, a[i], i, a));
		return out;
	},
	filter: (a: unknown[], [f]) => {
		const out: unknown[] = [];
		for (let i = 0; i < a.length; i++) if (invoke(f, a[i], i, a)) out.push(a[i]);
		return out;
	},
	forEach: (a: unknown[], [f]) => {
		for (let i = 0; i < a.length; i++) invoke(f, a[i], i, a);
	},
	reduce: (a: unknown[], args) => fold(a, args, "reduce", false),
	reduceRight: (a: unknown[], args) => fold(a, args, "reduceRight", true),
	find: (a: unknown[], [f]) => a[indexWhere(a, f, false)],
	findIndex: (a: unknown[], [f]) => indexWhere(a, f, false),
	findLast: (a: unknown[], [f]) => a[indexWhere(a, f, true)],
	findLastIndex: (a: unknown[], [f]) => indexWhere(a, f, true),
	some: (a: unknown[], [f]) => indexWhere(a, f, false) !== -1,
	every: (a: unknown[], [f]) => indexWhere(a, new Lambda((v, i, arr) => !invoke(f, v, i, arr)), false) === -1,
	slice: (a: unknown[], [start, end]) => a.slice(optNum(start), optNum(end)),
	join: (a: unknown[], [sep], budget) => {
		const separator = sep === undefined ? "," : String(sep);
		budget.string(a.length * separator.length);
		return a.map((v) => (v === null || v === undefined ? "" : String(v))).join(separator);
	},
	includes: (a: unknown[], [v, from], budget) => {
		budget.tick(a.length);
		return a.includes(v, optNum(from));
	},
	indexOf: (a: unknown[], [v, from], budget) => {
		budget.tick(a.length);
		return a.indexOf(v, optNum(from));
	},
	lastIndexOf: (a: unknown[], [v, from], budget) => {
		budget.tick(a.length);
		return from === undefined ? a.lastIndexOf(v) : a.lastIndexOf(v, num(from));
	},
	at: (a: unknown[], [i]) => a.at(num(i)),
	// Charged as it grows: a cycle in host data would double every level.
	flat: (a: unknown[], [depth], budget) => {
		const max = depth === undefined ? 1 : Math.min(num(depth), MAX_FLAT_DEPTH);
		const out: unknown[] = [];
		const push = (items: unknown[], level: number): void => {
			budget.growArray(out.length + items.length, items.length);
			for (let i = 0; i < items.length; i++) {
				if (!(i in items)) continue; // flat() drops holes
				const item = items[i];
				if (level < max && Array.isArray(item)) push(item, level + 1);
				else out.push(item);
			}
		};
		push(a, 0);
		return out;
	},
	flatMap: (a: unknown[], [f], budget) => {
		const out: unknown[] = [];
		for (let i = 0; i < a.length; i++) {
			const v = invoke(f, a[i], i, a);
			const delta = Array.isArray(v) ? v.length : 1;
			budget.growArray(out.length + delta, delta);
			if (Array.isArray(v)) out.push(...v);
			else out.push(v);
		}
		return out;
	},
	// The standard non-mutating pair; the mutating sort/reverse are not in the language.
	toSorted: (a: unknown[], [f], budget) => {
		budget.tick(a.length * 2);
		const copy = a.slice();
		if (f === undefined) return copy.sort();
		return copy.sort((x, y) => {
			budget.tick(1);
			return num(invoke(f, x, y));
		});
	},
	toReversed: (a: unknown[]) => a.slice().reverse(),
	// `toString` and `toLocaleString` collide with Object.prototype's members, so the literal loses contextual typing on them.
	toString: ((a: unknown[], _args: unknown[], budget: Budget) => {
		budget.tick(a.length);
		return a.toString();
	}) as MethodImpl,
	toLocaleString: ((a: unknown[], [locale, options]: unknown[], budget: Budget) => {
		budget.tick(a.length);
		return locale === undefined ? a.toLocaleString() : a.toLocaleString(locale as string, options as Intl.NumberFormatOptions | undefined);
	}) as MethodImpl,
	valueOf: (a: unknown[]) => a,
});

const STRING_METHODS: Record<string, MethodImpl> = table({
	toString: (s: string) => s,
	valueOf: (s: string) => s,
	toLocaleString: (s: string) => s,
	at: (s: string, [i]) => s.at(num(i)),
	endsWith: (s: string, [v, end]) => s.endsWith(String(v), optNum(end)),
	startsWith: (s: string, [v, position]) => s.startsWith(String(v), optNum(position)),
	includes: (s: string, [v, position]) => s.includes(String(v), optNum(position)),
	indexOf: (s: string, [v, position]) => s.indexOf(String(v), optNum(position)),
	lastIndexOf: (s: string, [v, position], budget) => {
		budget.tick(s.length); // V8 searches backwards naively — charged as a full scan
		return s.lastIndexOf(String(v), optNum(position));
	},
	normalize: (s: string, [form]) => s.normalize(optString(form)),
	padStart: (s: string, [n, pad], budget) => {
		const target = toLength(n);
		budget.string(target);
		return s.padStart(target, optString(pad));
	},
	padEnd: (s: string, [n, pad], budget) => {
		const target = toLength(n);
		budget.string(target);
		return s.padEnd(target, optString(pad));
	},
	repeat: (s: string, [n], budget) => {
		const count = num(n);
		if (!Number.isFinite(count) || count < 0) return fail(`repeat count ${String(n)} is not valid`);
		budget.string(s.length * count);
		return s.repeat(count);
	},
	// String patterns only. A regular expression would put ReDoS inside the regex engine, where no step counter can see it.
	replace: (s: string, [from, to], budget) => {
		const pattern = requireString(from, "replace");
		const replacement = String(to);
		budget.string(s.length + replacementBound(s, replacement));
		return s.replace(pattern, replacement);
	},
	replaceAll: (s: string, [from, to], budget) => {
		const pattern = requireString(from, "replaceAll");
		const replacement = String(to);
		budget.tick(s.length);
		budget.string(s.length + occurrences(s, pattern) * replacementBound(s, replacement));
		return s.replaceAll(pattern, replacement);
	},
	slice: (s: string, [start, end]) => s.slice(optNum(start), optNum(end)),
	substring: (s: string, [start, end]) => s.substring(start === undefined ? 0 : num(start), optNum(end)),
	split: (s: string, [sep, limit], budget) => {
		if (sep === undefined) return [s];
		const separator = requireString(sep, "split");
		budget.tick(s.length);
		const parts = separator === "" ? s.length : occurrences(s, separator) + 1;
		budget.array(limit === undefined ? parts : Math.min(parts, num(limit) >>> 0));
		return s.split(separator, optNum(limit));
	},
	toLowerCase: (s: string) => s.toLowerCase(),
	toUpperCase: (s: string) => s.toUpperCase(),
	trim: (s: string) => s.trim(),
	trimStart: (s: string) => s.trimStart(),
	trimEnd: (s: string) => s.trimEnd(),
	localeCompare: (s: string, [v, locales, options]) =>
		s.localeCompare(String(v), locales as string | undefined, options as Intl.CollatorOptions | undefined),
});

const NUMBER_METHODS: Record<string, MethodImpl> = table({
	valueOf: (n: number) => n,
	toFixed: (n: number, [digits]) => n.toFixed(optNum(digits)),
	toString: ((n: number, [radix]: unknown[]) => n.toString(optNum(radix))) as MethodImpl,
	toLocaleString: ((n: number, [locale, options]: unknown[]) =>
		n.toLocaleString(locale as string | undefined, options as Intl.NumberFormatOptions | undefined)) as MethodImpl,
});

const DATE_METHODS: Record<string, MethodImpl> = methodTable(METHOD_NAMES.Date, (name) => (d: Date, args: unknown[]) => {
	const method = (d as unknown as Record<string, (...a: unknown[]) => unknown>)[name];
	return method.apply(d, args.slice(0, 2));
});

const MAP_METHODS: Record<string, MethodImpl> = table({
	get: (m: Map<unknown, unknown>, [k]) => m.get(k),
	has: (m: Map<unknown, unknown>, [k]) => m.has(k),
	keys: (m: Map<unknown, unknown>) => [...m.keys()],
	values: (m: Map<unknown, unknown>) => [...m.values()],
	entries: (m: Map<unknown, unknown>) => [...m.entries()],
});

const SET_METHODS: Record<string, MethodImpl> = table({
	has: (s: Set<unknown>, [v]) => s.has(v),
	values: (s: Set<unknown>) => [...s.values()],
});

const FORMATTER_METHODS: Record<string, MethodImpl> = table({
	format: (f: Formatter, [v]) => f.format(v as never),
});

// Static members of the allow-listed namespaces.
const NAMESPACE_METHODS: Record<string, Record<string, MethodImpl>> = table({
	Math: nativeTable(Math, NAMESPACE_METHOD_NAMES.Math),
	Number: nativeTable(Number, NAMESPACE_METHOD_NAMES.Number),
	Date: nativeTable(Date, NAMESPACE_METHOD_NAMES.Date),
	JSON: table({
		parse: (_r, [text], budget) => {
			const source = String(text);
			budget.tick(Math.ceil(source.length / 64));
			return JSON.parse(source);
		},
		stringify: (_r, [value, replacer, space]) => {
			// A function replacer would take a function, so it is dropped; an array one is JS's key allow-list.
			const allowed = Array.isArray(replacer) ? new Set(replacer.map(String)) : null;
			return JSON.stringify(
				value,
				function (this: unknown, key: string, v: unknown) {
					if (allowed && key !== "" && !Array.isArray(this) && !allowed.has(key)) return undefined;
					return asJson(v);
				},
				space === undefined ? undefined : (space as string | number),
			);
		},
	}),
	Object: table({
		keys: (_r, [o]) => Object.keys(objectArg(o, "Object.keys")),
		values: (_r, [o]) => Object.values(objectArg(o, "Object.values")),
		entries: (_r, [o]) => Object.entries(objectArg(o, "Object.entries")),
		fromEntries: (_r, [source], budget) => {
			const pairs = source instanceof Map ? [...source] : source;
			if (!Array.isArray(pairs)) return reject("Object.fromEntries needs an array or Map of [key, value] pairs");
			const out: Record<string, unknown> = {};
			for (const pair of pairs) {
				budget.tick(1);
				if (!Array.isArray(pair)) return reject("Object.fromEntries needs [key, value] pairs");
				Object.defineProperty(out, String(pair[0]), { value: pair[1], writable: true, enumerable: true, configurable: true });
			}
			return out;
		},
	}),
	Array: table({
		isArray: (_r, [v]) => Array.isArray(v),
		from: (_r, [source, mapper], budget) => {
			let base: unknown[];
			if (Array.isArray(source)) base = source;
			else if (typeof source === "string") base = [...source];
			else if (source instanceof Set || source instanceof Map) base = [...source];
			else if (source && typeof source === "object" && "length" in source) {
				// The one source that makes elements out of a number — charged before they exist.
				const length = toLength((source as { length: unknown }).length);
				budget.array(length);
				base = new Array(length).fill(undefined);
			} else {
				return fail("Array.from needs an array, string, Set, Map, or {length}");
			}
			return mapper === undefined ? [...base] : base.map((v, i) => invoke(mapper, v, i));
		},
	}),
});

// The table a receiver's methods live in, or undefined when it has none.
export const methodsOf = (obj: unknown): Record<string, MethodImpl> | undefined => {
	if (typeof obj === "string") return STRING_METHODS;
	if (typeof obj === "number") return NUMBER_METHODS;
	if (Array.isArray(obj)) return ARRAY_METHODS;
	if (obj instanceof Namespace) return NAMESPACE_METHODS[obj.name];
	if (obj instanceof Date) return DATE_METHODS;
	if (obj instanceof Map) return MAP_METHODS;
	if (obj instanceof Set) return SET_METHODS;
	if (obj instanceof Formatter) return FORMATTER_METHODS;
	return undefined;
};
