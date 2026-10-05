import { INTL_CACHE_SIZE } from "../constants/limits";
import type { Budget } from "./budget";
import { JSON_SCALAR_WIDTH } from "./coerce";
import { fail, isPlainObject, reject } from "./values";

// Intl objects are immutable, so one per locale and options serves every caller. Building one is slow and steps barely
// count it, so a build checks the clock.

type Locales = string | string[] | undefined;

const LOCALE_MESSAGE = 'A locale is a string, as "en-US", or an array of them';
const OPTIONS_MESSAGE =
  'Locale options are an object of strings, numbers and booleans, as { style: "currency", currency: "USD" }';

// The engine reads locales and options itself, running any getter or `toString` it meets, so only plain values reach it.
// It checks each tag of a list against the tags it kept, in time of the list's square.
export const localeList = (locales: unknown, budget: Budget): Locales => {
  let list: Locales;
  if (locales === undefined || typeof locales === "string") list = locales;
  else if (Array.isArray(locales) && locales.every((tag): tag is string => typeof tag === "string")) list = locales;
  // JS fails on `null` and on an array of anything but tags too, and takes any other value as no locale.
  else return (locales === null || Array.isArray(locales) ? fail : reject)(LOCALE_MESSAGE);
  if (Array.isArray(list)) budget.tick(list.length * list.length);
  return list;
};

const isScalar = (v: unknown): boolean => v === null || (typeof v !== "object" && typeof v !== "function");

const checkOptions = (options: unknown): void => {
  if (options === undefined) return;
  if (
    typeof options === "object" &&
    options !== null &&
    isPlainObject(options) &&
    Object.values(options).every(isScalar)
  ) {
    return;
  }
  // JS fails on `null` too.
  (options === null ? fail : reject)(OPTIONS_MESSAGE);
};

// The cache key, tagged so `2` and `"2"`, or `undefined` and `null`, never share an entry.
// Charged piece by piece as it is built, so an oversized key stops before it exists.
const keyOf = (kind: string, locales: unknown, options: unknown, budget: Budget): string => {
  let size = kind.length;
  const text = JSON.stringify([locales, options], (name: string, value: unknown) => {
    const length = name.length + (typeof value === "string" ? value.length : JSON_SCALAR_WIDTH);
    size += length;
    budget.growString(size, length);
    if (typeof value === "number") return `n${value}`;
    if (typeof value === "string") return `s${value}`;
    if (value === undefined) return "u";
    return value;
  });
  return kind + text;
};

const cached = <T>(
  cache: Map<string, T>,
  kind: string,
  locales: unknown,
  options: unknown,
  budget: Budget,
  build: () => T,
): T => {
  checkOptions(options);
  const list = localeList(locales, budget);
  const key = keyOf(kind, list, options, budget);
  let value = cache.get(key);
  if (value === undefined) {
    value = build();
    budget.clock();
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
