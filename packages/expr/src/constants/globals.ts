// The globals an expression can name without a context, and what each one is. Nothing else resolves — `fetch` is absent, not blocked.

const nullProto = <T>(entries: Record<string, T>): Readonly<Record<string, T>> =>
	Object.freeze(Object.assign(Object.create(null) as Record<string, T>, entries));

// Namespaces: every read and call on one goes through the tables.
export const NAMESPACE_GLOBALS: readonly string[] = Object.freeze([
	"Math", "JSON", "Object", "Array", "Intl",
	"Number", "String", "Boolean", "Date",
	"Map", "Set", "URL",
	"parseInt", "parseFloat", "isNaN", "isFinite", "encodeURIComponent", "decodeURIComponent",
]);

// Bare constants.
export const CONSTANT_GLOBALS: Readonly<Record<string, unknown>> = Object.freeze({
	undefined: undefined,
	NaN: Number.NaN,
	Infinity: Number.POSITIVE_INFINITY,
});

// Every name an expression can use without a context — what the prompt advertises.
export const ALLOWED_GLOBALS: readonly string[] = Object.freeze([...NAMESPACE_GLOBALS, ...Object.keys(CONSTANT_GLOBALS)]);

// Callable bare: `Number(x)`, `parseInt(s)`. runtime/globals.ts implements exactly these.
export const CALLABLE_GLOBALS: ReadonlySet<string> = new Set([
	"Number", "String", "Boolean",
	"parseInt", "parseFloat", "isNaN", "isFinite", "encodeURIComponent", "decodeURIComponent",
]);

// `new` works for these; the Intl formatters are reached as `Intl.NumberFormat`.
export const CONSTRUCTIBLE_GLOBALS: ReadonlySet<string> = new Set(["Date", "Map", "Set", "URL"]);

// Globals that are objects in JS; every other namespace is a function there.
export const OBJECT_NAMESPACES: ReadonlySet<string> = new Set(["Math", "JSON", "Intl"]);

// Namespaces reachable as a property of another namespace.
export const NESTED_NAMESPACES: Readonly<Record<string, ReadonlySet<string>>> = nullProto({
	Intl: new Set(["NumberFormat", "DateTimeFormat"]),
});

// Readable properties of a URL — `searchParams` holds methods and stays out.
export const URL_PROPS: ReadonlySet<string> = new Set([
	"href", "protocol", "host", "hostname", "port",
	"pathname", "search", "hash", "origin",
]);

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
