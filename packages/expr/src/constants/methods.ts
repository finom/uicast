import { nullProto } from "./globals";

// runtime/methods.ts implements exactly these; constants.test.ts holds the two equal.

export const METHOD_NAMES: Readonly<Record<string, ReadonlySet<string>>> = Object.freeze({
	array: new Set([
		"map", "filter", "reduce", "reduceRight",
		"find", "findIndex", "findLast", "findLastIndex", "some", "every",
		"slice", "concat", "join", "includes", "indexOf", "lastIndexOf", "at", "flat", "flatMap",
		"toSorted", "toReversed", "toSpliced", "with", "toString", "toLocaleString", "valueOf",
	]),
	string: new Set([
		"at", "charAt", "charCodeAt", "codePointAt", "startsWith", "endsWith", "includes", "indexOf", "lastIndexOf",
		"slice", "substring", "concat", "split", "replace", "replaceAll", "repeat", "padStart", "padEnd",
		"toLowerCase", "toUpperCase", "toLocaleLowerCase", "toLocaleUpperCase", "trim", "trimStart", "trimEnd",
		"normalize", "isWellFormed", "toWellFormed", "localeCompare", "toString", "toLocaleString", "valueOf",
	]),
	number: new Set(["toFixed", "toExponential", "toPrecision", "toString", "toLocaleString", "valueOf"]),
	Date: new Set([
		"getTime", "getFullYear", "getMonth", "getDate", "getDay", "getHours",
		"getMinutes", "getSeconds", "getMilliseconds", "getTimezoneOffset",
		"getUTCFullYear", "getUTCMonth", "getUTCDate", "getUTCDay", "getUTCHours",
		"getUTCMinutes", "getUTCSeconds", "getUTCMilliseconds",
		"toISOString", "toJSON", "toUTCString", "toDateString", "toTimeString",
		"toLocaleDateString", "toLocaleTimeString", "toLocaleString", "toString", "valueOf",
	]),
	Set: new Set([
		"has", "union", "intersection", "difference", "symmetricDifference", "isSubsetOf", "isSupersetOf", "isDisjointFrom",
	]),
});

// Read by the validator from a written name, so null-prototype.
export const NAMESPACE_METHOD_NAMES: Readonly<Record<string, ReadonlySet<string>>> = nullProto({
	Math: new Set([
		"abs", "ceil", "floor", "round", "trunc", "sign", "sqrt", "cbrt",
		"pow", "min", "max", "hypot", "log", "log2", "log10", "log1p",
		"exp", "expm1", "sin", "cos", "tan", "asin", "acos", "atan", "atan2",
		"sinh", "cosh", "tanh", "asinh", "acosh", "atanh", "fround", "f16round", "clz32", "imul", "sumPrecise", "random",
	]),
	JSON: new Set(["parse", "stringify"]),
	Object: new Set(["keys", "values", "entries", "fromEntries", "groupBy", "hasOwn", "is"]),
	Array: new Set(["isArray", "from", "of"]),
	Number: new Set(["isInteger", "isFinite", "isNaN", "isSafeInteger", "parseFloat", "parseInt"]),
	String: new Set(["fromCharCode", "fromCodePoint"]),
	Date: new Set(["now", "parse", "UTC"]),
});

// The validator refuses a written call outside it, so both back ends refuse the same set.
export const ALLOWED_METHOD_NAMES: ReadonlySet<string> = new Set([
	...Object.values(METHOD_NAMES).flatMap((set) => [...set]),
	...Object.values(NAMESPACE_METHOD_NAMES).flatMap((set) => [...set]),
]);

// The one argument of each method that takes a function. An arrow is written there or nowhere,
// so a function is never a value: nothing can store, return or call one, and nothing recurses.
export const CALLBACK_ARGUMENT: Readonly<Record<string, number>> = nullProto({
	map: 0, filter: 0, reduce: 0, reduceRight: 0,
	find: 0, findIndex: 0, findLast: 0, findLastIndex: 0, some: 0, every: 0, flatMap: 0, toSorted: 0,
	from: 1, groupBy: 1,
});

// Locale methods format and compare in the viewer's locale, so they take no locale or options argument.
export const LOCALE_METHOD_ARITY: Readonly<Record<string, number>> = nullProto({
	toLocaleString: 0, toLocaleDateString: 0, toLocaleTimeString: 0,
	toLocaleLowerCase: 0, toLocaleUpperCase: 0, localeCompare: 1,
});

export const localeArgumentsMessage = (name: string): string =>
	LOCALE_METHOD_ARITY[name] === 0
		? `".${name}()" takes no arguments: it uses the viewer's locale. Currency, month names and relative times are a component's job`
		: `".${name}()" takes only the string to compare with: it uses the viewer's locale`;
