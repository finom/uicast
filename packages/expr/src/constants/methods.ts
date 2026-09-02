// The methods an expression can call, by receiver — the whole allow-list, as data. runtime/methods.ts implements exactly these; constants.test.ts holds the two equal.

const names = (list: string[]): ReadonlySet<string> => new Set(list);

export const METHOD_NAMES: Readonly<Record<string, ReadonlySet<string>>> = Object.freeze({
	array: names([
		"map", "filter", "forEach", "reduce", "reduceRight",
		"find", "findIndex", "findLast", "findLastIndex", "some", "every",
		"slice", "join", "includes", "indexOf", "lastIndexOf", "at", "flat", "flatMap",
		"toSorted", "toReversed", "toString", "toLocaleString", "valueOf",
	]),
	string: names([
		"at", "startsWith", "endsWith", "includes", "indexOf", "lastIndexOf",
		"slice", "substring", "split", "replace", "replaceAll", "repeat", "padStart", "padEnd",
		"toLowerCase", "toUpperCase", "trim", "trimStart", "trimEnd", "normalize", "localeCompare",
		"toString", "toLocaleString", "valueOf",
	]),
	number: names(["toFixed", "toString", "toLocaleString", "valueOf"]),
	Date: names([
		"getTime", "getFullYear", "getMonth", "getDate", "getDay", "getHours",
		"getMinutes", "getSeconds", "getMilliseconds", "getTimezoneOffset",
		"getUTCFullYear", "getUTCMonth", "getUTCDate", "getUTCDay", "getUTCHours",
		"getUTCMinutes", "getUTCSeconds",
		"toISOString", "toJSON", "toDateString", "toTimeString",
		"toLocaleDateString", "toLocaleTimeString", "toLocaleString", "toString", "valueOf",
	]),
	Map: names(["get", "has", "keys", "values", "entries"]),
	Set: names(["has", "values"]),
	formatter: names(["format"]),
});

// Static functions per namespace. Read by the validator from a written name, so null-prototype.
export const NAMESPACE_METHOD_NAMES: Readonly<Record<string, ReadonlySet<string>>> = Object.freeze(
	Object.assign(Object.create(null) as Record<string, ReadonlySet<string>>, {
		Math: names([
			"abs", "ceil", "floor", "round", "trunc", "sign", "sqrt", "cbrt",
			"pow", "min", "max", "hypot", "log", "log2", "log10", "log1p",
			"exp", "expm1", "sin", "cos", "tan", "asin", "acos", "atan", "atan2",
			"sinh", "cosh", "tanh", "fround", "clz32", "imul",
		]),
		JSON: names(["parse", "stringify"]),
		Object: names(["keys", "values", "entries", "fromEntries"]),
		Array: names(["isArray", "from"]),
		Number: names(["isInteger", "isFinite", "isNaN", "isSafeInteger", "parseFloat", "parseInt"]),
		Date: names(["now", "UTC"]),
	}),
);

// Every callable method name. The validator refuses a written call outside it, so both back ends refuse the same set.
export const ALLOWED_METHOD_NAMES: ReadonlySet<string> = new Set([
	...Object.values(METHOD_NAMES).flatMap((set) => [...set]),
	...Object.values(NAMESPACE_METHOD_NAMES).flatMap((set) => [...set]),
]);
