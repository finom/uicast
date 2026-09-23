// Nothing else resolves: `fetch` is absent, not blocked.

export const nullProto = <T>(entries: Record<string, T>): Readonly<Record<string, T>> =>
	Object.freeze(Object.assign(Object.create(null) as Record<string, T>, entries));

export const NAMESPACE_GLOBALS: readonly string[] = Object.freeze([
	"Math", "JSON", "Object", "Array",
	"Number", "String", "Boolean", "Date", "Set",
	"parseInt", "parseFloat", "isNaN", "isFinite", "encodeURIComponent", "decodeURIComponent",
]);

export const CONSTANT_GLOBALS: Readonly<Record<string, unknown>> = Object.freeze({
	undefined: undefined,
	NaN: Number.NaN,
	Infinity: Number.POSITIVE_INFINITY,
});

// What the prompt advertises.
export const ALLOWED_GLOBALS: readonly string[] = Object.freeze([...NAMESPACE_GLOBALS, ...Object.keys(CONSTANT_GLOBALS)]);

// Callable bare: `Number(x)`, `parseInt(s)`. runtime/globals.ts implements exactly these.
export const CALLABLE_GLOBALS: ReadonlySet<string> = new Set([
	"Number", "String", "Boolean",
	"parseInt", "parseFloat", "isNaN", "isFinite", "encodeURIComponent", "decodeURIComponent",
]);

// `new` works for these.
export const CONSTRUCTIBLE_GLOBALS: ReadonlySet<string> = new Set(["Date", "Set"]);

// Globals that are objects in JS; every other namespace is a function there.
export const OBJECT_NAMESPACES: ReadonlySet<string> = new Set(["Math", "JSON"]);

export const MATH_CONSTANTS: Readonly<Record<string, number>> = nullProto({
	PI: Math.PI, E: Math.E, LN2: Math.LN2, LN10: Math.LN10,
	LOG2E: Math.LOG2E, LOG10E: Math.LOG10E, SQRT1_2: Math.SQRT1_2, SQRT2: Math.SQRT2,
});

export const NUMBER_CONSTANTS: Readonly<Record<string, number>> = nullProto({
	MAX_SAFE_INTEGER: Number.MAX_SAFE_INTEGER,
	MIN_SAFE_INTEGER: Number.MIN_SAFE_INTEGER,
	MAX_VALUE: Number.MAX_VALUE,
	MIN_VALUE: Number.MIN_VALUE,
	EPSILON: Number.EPSILON,
	POSITIVE_INFINITY: Number.POSITIVE_INFINITY,
	NEGATIVE_INFINITY: Number.NEGATIVE_INFINITY,
	NaN: Number.NaN,
});
