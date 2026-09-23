import { INTL_CACHE_SIZE, PRICES } from "../constants/limits";
import type { Budget } from "./budget";
import { JSON_SCALAR_WIDTH, textCost } from "./coerce";
import { isPlainObject, reject } from "./values";

// Intl objects are immutable, so one per locale and options serves every caller. Each distinct pair is charged
// a build once per evaluation, cached or not, so the step count does not depend on what ran before.

type Locales = string | string[] | undefined;

const tagCount = (locales: Locales): number => (Array.isArray(locales) ? Math.max(locales.length, 1) : 1);

// The engine reads locales and options itself, running any getter or `toString` it meets, so only plain values reach it.
// Charged per tag: the engine resolves every tag in a list.
export const localeList = (locales: unknown, budget: Budget): Locales => {
	let list: Locales;
	if (locales === undefined || typeof locales === "string") list = locales;
	else if (Array.isArray(locales) && locales.every((tag): tag is string => typeof tag === "string")) list = locales;
	else return reject("A locale is a string, as \"en-US\", or an array of them");
	budget.tick(PRICES.locale * tagCount(list));
	return list;
};

const isScalar = (v: unknown): boolean => v === null || (typeof v !== "object" && typeof v !== "function");

const checkOptions = (options: unknown): void => {
	if (options === undefined) return;
	if (typeof options === "object" && options !== null && isPlainObject(options) && Object.values(options).every(isScalar)) {
		return;
	}
	reject("Locale options are an object of strings, numbers and booleans, as { style: \"currency\", currency: \"USD\" }");
};

// The cache key, tagged so `2` and `"2"`, or `undefined` and `null`, never share an entry.
// Charged piece by piece as it is built, so an oversized key stops before it exists.
const keyOf = (kind: string, locales: unknown, options: unknown, budget: Budget): string => {
	let size = kind.length;
	const text = JSON.stringify([locales, options], (name: string, value: unknown) => {
		const length = name.length + (typeof value === "string" ? value.length : JSON_SCALAR_WIDTH);
		size += length;
		budget.growString(size, length);
		budget.tick(textCost(length));
		if (typeof value === "number") return `n${value}`;
		if (typeof value === "string") return `s${value}`;
		if (value === undefined) return "u";
		return value;
	});
	return kind + text;
};

const cached = <T>(cache: Map<string, T>, kind: string, locales: unknown, options: unknown, budget: Budget, build: () => T): T => {
	checkOptions(options);
	const list = localeList(locales, budget);
	const key = keyOf(kind, list, options, budget);
	budget.once(key, PRICES.intlBuild * tagCount(list));
	let value = cache.get(key);
	if (value === undefined) {
		value = build();
		if (cache.size >= INTL_CACHE_SIZE) {
			const oldest = cache.keys().next().value;
			if (oldest !== undefined) cache.delete(oldest);
		}
		cache.set(key, value);
	}
	return value;
};

const numberFormats = new Map<string, Intl.NumberFormat>();
const collators = new Map<string, Intl.Collator>();

export const numberFormat = (locales: unknown, options: unknown, budget: Budget): Intl.NumberFormat =>
	cached(numberFormats, "n", locales, options, budget, () => Reflect.construct(Intl.NumberFormat, [locales, options]));

export const collator = (locales: unknown, options: unknown, budget: Budget): Intl.Collator =>
	cached(collators, "c", locales, options, budget, () => Reflect.construct(Intl.Collator, [locales, options]));
