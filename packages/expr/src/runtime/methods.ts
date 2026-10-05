import { nullProto, OBJECT_NAMESPACES } from "../constants/globals";
import { MAX_FLAT_DEPTH, MAX_MARK_RUN } from "../constants/limits";
import { NAMESPACE_METHOD_NAMES } from "../constants/methods";
import { type Budget, exceeded } from "./budget";
import { collator, localeList, numberFormat } from "./intl";
import { f16round, sumPrecise } from "./numeric";
import { chargeNumber, chargeText, joinedSize, jsonSize, num, toInteger, toLength } from "./coerce";
import { checkCallback, fail, invoke, isPlainObject, Lambda, Namespace, plainData } from "./values";

// The membrane charges the result's size; a method charges the work it does, and output that can outgrow its input
// before producing it.
// Methods newer than ES2022 are written out here, so an engine without them still runs them.

// `recv` is `never` so each table can type its own receiver.
type MethodImpl = (recv: never, args: unknown[], budget: Budget) => unknown;
type Methods = Readonly<Record<string, MethodImpl>>;

const requireString = (v: unknown, method: string): string =>
  typeof v === "string" ? v : fail(`"${method}" needs a string argument here — regular expressions are not available`);

const optNum = (v: unknown, budget: Budget): number | undefined => (v === undefined ? undefined : num(v, budget));

// JS's ToString, charged: only an array is long to convert.
const asText = (v: unknown, budget: Budget): string => {
  chargeText(v, budget);
  return String(v);
};
const optString = (v: unknown, budget: Budget): string | undefined => (v === undefined ? undefined : asText(v, budget));

const replacerKeys = (replacer: unknown[], budget: Budget): string[] => {
  budget.tick(replacer.length);
  return [...new Set(replacer.filter((k) => typeof k === "string" || typeof k === "number").map(String))];
};

// A relative position clamped into [0, length], as slice and toSpliced read it.
const clampIndex = (v: unknown, length: number, budget: Budget): number => {
  const n = toInteger(v, budget);
  return n < 0 ? Math.max(length + n, 0) : Math.min(n, length);
};

// Non-overlapping occurrences — what replaceAll replaces and split cuts at.
const occurrences = (s: string, sub: string): number => {
  if (sub === "") return s.length + 1;
  let count = 0;
  for (let i = s.indexOf(sub); i !== -1; i = s.indexOf(sub, i + sub.length)) count++;
  return count;
};

// The most one replacement can lengthen the text. `$&` inserts the match, and `` $` `` and `$'` up to the whole
// receiver; any other `$` stays one character.
const replacementGrowth = (s: string, pattern: string, to: string, budget: Budget): number => {
  budget.text(to.length);
  const inserted = occurrences(to, "$&") * pattern.length + (occurrences(to, "$`") + occurrences(to, "$'")) * s.length;
  return Math.max(0, to.length + inserted - pattern.length);
};

// The indent JSON.stringify applies per level: a number or a string's length, clamped to 10.
const indentWidth = (space: unknown, budget: Budget): number => {
  if (typeof space === "number") return Math.min(10, toLength(space, budget));
  if (typeof space === "string") return Math.min(10, space.length);
  return 0;
};

const indexWhere = (a: unknown[], f: unknown, fromEnd: boolean): number => {
  checkCallback(f);
  if (fromEnd) {
    for (let i = a.length - 1; i >= 0; i--) if (invoke(f, a[i], i, a)) return i;
  } else {
    for (let i = 0; i < a.length; i++) if (invoke(f, a[i], i, a)) return i;
  }
  return -1;
};

const fold = (a: unknown[], args: unknown[], method: string, fromEnd: boolean): unknown => {
  const [f] = args;
  checkCallback(f);
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

// The items of what JS iterates: an array, or a string's characters, copied and charged first.
const itemsOf = (v: unknown, where: string, budget: Budget): unknown[] => {
  if (Array.isArray(v)) return v;
  if (typeof v !== "string") return fail(`${where} needs an array or a string`);
  budget.array(v.length);
  return [...v];
};

const methodTable = (names: Iterable<string>, impl: (name: string) => MethodImpl): Methods =>
  nullProto(Object.fromEntries([...names].map((name) => [name, impl(name)])));

const nativeTable = (target: object, names: Iterable<string>): Methods =>
  methodTable(names, (name) => {
    const fn = (target as Record<string, (...a: unknown[]) => unknown>)[name];
    return (_r, args, budget) => {
      for (const arg of args) chargeNumber(arg, budget);
      return fn(...args);
    };
  });

// `{ length: n }` is the one source that makes items out of a number: charged before they exist.
const arrayLike = (source: Record<string, unknown>, budget: Budget): unknown[] => {
  const length = Object.hasOwn(source, "length") ? toLength(source.length, budget) : 0;
  budget.array(length);
  const out: unknown[] = [];
  for (let i = 0; i < length; i++) out.push(Object.hasOwn(source, i) ? source[i] : undefined);
  return out;
};

// What JS's stringify does to a global: omitted, or `{}` for the object namespaces.
const asJson = (v: unknown): unknown => {
  if (v instanceof Namespace) return OBJECT_NAMESPACES.has(v.name) ? {} : undefined;
  return v;
};

// JS boxes a primitive receiver; this language refuses it, and null throws in both.
const objectArg = (o: unknown, where: string): object =>
  o === null || o === undefined ? fail(`${where} cannot convert ${String(o)} to an object`) : plainData(o, where);

const ARRAY_METHODS: Methods = nullProto({
  // No per-iteration tick: each `invoke` charges the callback's whole compiled cost.
  map: (a: unknown[], [f]) => {
    checkCallback(f);
    const out: unknown[] = [];
    for (let i = 0; i < a.length; i++) out.push(invoke(f, a[i], i, a));
    return out;
  },
  filter: (a: unknown[], [f]) => {
    checkCallback(f);
    const out: unknown[] = [];
    for (let i = 0; i < a.length; i++) if (invoke(f, a[i], i, a)) out.push(a[i]);
    return out;
  },
  reduce: (a: unknown[], args) => fold(a, args, "reduce", false),
  reduceRight: (a: unknown[], args) => fold(a, args, "reduceRight", true),
  find: (a: unknown[], [f]) => a[indexWhere(a, f, false)],
  findIndex: (a: unknown[], [f]) => indexWhere(a, f, false),
  findLast: (a: unknown[], [f]) => a[indexWhere(a, f, true)],
  findLastIndex: (a: unknown[], [f]) => indexWhere(a, f, true),
  some: (a: unknown[], [f]) => indexWhere(a, f, false) !== -1,
  every: (a: unknown[], [f]) => {
    checkCallback(f);
    return indexWhere(a, new Lambda((v, i, arr) => !invoke(f, v, i, arr)), false) === -1;
  },
  slice: (a: unknown[], [start, end], budget) => a.slice(optNum(start, budget), optNum(end, budget)),
  // Charged before it exists: each written argument can be the whole receiver again.
  concat: (a: unknown[], args, budget) => {
    let length = a.length;
    for (const arg of args) length += Array.isArray(arg) ? arg.length : 1;
    budget.checkArray(length);
    return a.concat(...args);
  },
  join: (a: unknown[], [sep], budget) => {
    const separator = sep === undefined ? "," : asText(sep, budget);
    budget.checkString(joinedSize(a, budget) + a.length * separator.length);
    return a.map((v) => (v === null || v === undefined ? "" : String(v))).join(separator);
  },
  // JS reads the start position only when the array has items.
  includes: (a: unknown[], [v, from], budget) => {
    budget.tick(a.length);
    return a.length > 0 && a.includes(v, optNum(from, budget));
  },
  indexOf: (a: unknown[], [v, from], budget) => {
    budget.tick(a.length);
    return a.length === 0 ? -1 : a.indexOf(v, optNum(from, budget));
  },
  lastIndexOf: (a: unknown[], args, budget) => {
    budget.tick(a.length);
    if (a.length === 0) return -1;
    return args.length < 2 ? a.lastIndexOf(args[0]) : a.lastIndexOf(args[0], num(args[1], budget));
  },
  at: (a: unknown[], [i], budget) => a.at(num(i, budget)),
  // Charged as it grows: a cycle in host data would double every level.
  flat: (a: unknown[], [depth], budget) => {
    const max = depth === undefined ? 1 : Math.min(toInteger(depth, budget), MAX_FLAT_DEPTH);
    const out: unknown[] = [];
    const push = (items: unknown[], level: number): void => {
      budget.checkArray(out.length + items.length);
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
    checkCallback(f);
    const out: unknown[] = [];
    for (let i = 0; i < a.length; i++) {
      const v = invoke(f, a[i], i, a);
      const delta = Array.isArray(v) ? v.length : 1;
      budget.checkArray(out.length + delta);
      if (Array.isArray(v)) out.push(...v);
      else out.push(v);
    }
    return out;
  },
  // The standard non-mutating trio; the mutating sort, reverse and splice are not in the language.
  toSorted: (a: unknown[], [f], budget) => {
    if (f === undefined) return sortAsText(a, budget);
    checkCallback(f);
    budget.tick(a.length * 2);
    return a.slice().sort((x, y) => {
      budget.tick(1);
      return num(invoke(f, x, y), budget);
    });
  },
  toReversed: (a: unknown[]) => a.slice().reverse(),
  // A missing argument and an `undefined` one differ here, as in JS.
  toSpliced: (a: unknown[], args, budget) => {
    const length = a.length;
    const start = clampIndex(args[0], length, budget);
    let skip = 0;
    if (args.length === 1) skip = length - start;
    else if (args.length > 1) skip = Math.min(Math.max(toInteger(args[1], budget), 0), length - start);
    budget.tick(length);
    const out: unknown[] = [];
    for (let i = 0; i < start; i++) out.push(a[i]);
    for (let i = 2; i < args.length; i++) out.push(args[i]);
    for (let i = start + skip; i < length; i++) out.push(a[i]);
    return out;
  },
  with: (a: unknown[], [index, value], budget) => {
    const relative = toInteger(index, budget);
    const at = relative < 0 ? a.length + relative : relative;
    if (at < 0 || at >= a.length) return fail(`Index ${String(index)} is out of range for an array of ${a.length}`);
    budget.tick(a.length);
    const out: unknown[] = [];
    for (let i = 0; i < a.length; i++) out.push(i === at ? value : a[i]);
    return out;
  },
  // `toString` and `toLocaleString` collide with Object.prototype's members, so the literal loses contextual typing on them.
  toString: (a: unknown[], _args: unknown[], budget: Budget) => {
    budget.checkString(joinedSize(a, budget) + a.length);
    return a.toString();
  },
  toLocaleString: (a: unknown[], [locales, options]: unknown[], budget: Budget) => {
    budget.checkString(joinedSize(a, budget) + a.length);
    return localeJoin(a, locales, options, budget);
  },
  valueOf: (a: unknown[]) => a,
});

// JS's default order compares items as text, converting both sides on every comparison.
// Each item converts once here, charged; `undefined` sorts last, as in JS.
const sortAsText = (a: unknown[], budget: Budget): unknown[] => {
  const keyed: { key: string; value: unknown }[] = [];
  let missing = 0;
  for (const value of a) {
    if (value === undefined) missing++;
    else keyed.push({ key: asText(value, budget), value });
  }
  keyed.sort((x, y) => {
    budget.tick(1);
    budget.text(Math.min(x.key.length, y.key.length));
    if (x.key < y.key) return -1;
    return x.key > y.key ? 1 : 0;
  });
  const out = keyed.map((item) => item.value);
  for (let i = 0; i < missing; i++) out.push(undefined);
  return out;
};

// Array.prototype.toLocaleString element by element, so each number is charged its formatting.
const localeJoin = (a: readonly unknown[], locales: unknown, options: unknown, budget: Budget): string => {
  let out = "";
  for (let i = 0; i < a.length; i++) {
    if (i > 0) out += ",";
    out += localeText(a[i], locales, options, budget);
  }
  return out;
};

const localeText = (item: unknown, locales: unknown, options: unknown, budget: Budget): string => {
  if (typeof item === "number") return formatNumber(item, [locales, options], budget);
  if (Array.isArray(item)) return localeJoin(item, locales, options, budget);
  // Nothing else reads the locale.
  return [item].toLocaleString();
};

// The offset of the first lone surrogate at or after `from`, or -1.
const loneSurrogate = (s: string, from: number): number => {
  for (let i = from; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c < 0xd800 || c > 0xdfff) continue;
    const pairs = c <= 0xdbff && i + 1 < s.length && (s.charCodeAt(i + 1) & 0xfc00) === 0xdc00;
    if (!pairs) return i;
    i++;
  }
  return -1;
};

const REPLACEMENT_CHARACTER = "�";

// Charge one pass over `s` and hand it back.
const read = (s: string, budget: Budget): string => {
  budget.text(s.length);
  return s;
};

// The engine's search can compare the whole pattern at each position of the text.
const chargeSearch = (s: string, pattern: string, budget: Budget): void =>
  budget.text(s.length * Math.max(pattern.length, 1));

// Putting a run of combining marks in order takes time of its square, inside the engine where no step counts it.
const LONG_MARK_RUN = new RegExp(`\\p{M}{${MAX_MARK_RUN + 1}}`, "u");
const markSafe = (s: string): string =>
  LONG_MARK_RUN.test(s) ? exceeded(`Text has more than ${MAX_MARK_RUN} combining marks in a row`) : s;

// As in JS: the filler is read only when there is something to fill, and an empty one fills nothing.
const pad = (s: string, [n, filler]: unknown[], budget: Budget, atEnd: boolean): string => {
  const length = toLength(n, budget);
  if (length <= s.length) return s;
  const fill = optString(filler, budget);
  if (fill === "") return s;
  budget.checkString(length);
  return atEnd ? s.padEnd(length, fill) : s.padStart(length, fill);
};

// The locales a case change reads.
const caseLocales = (s: string, locales: unknown, budget: Budget) => {
  const list = locales === undefined ? undefined : localeList(locales, budget);
  budget.text(s.length);
  return list;
};

const STRING_METHODS: Methods = nullProto({
  toString: (s: string) => s,
  valueOf: (s: string) => s,
  toLocaleString: (s: string) => s,
  at: (s: string, [i], budget) => s.at(num(i, budget)),
  charAt: (s: string, [i], budget) => s.charAt(num(i, budget)),
  charCodeAt: (s: string, [i], budget) => s.charCodeAt(num(i, budget)),
  codePointAt: (s: string, [i], budget) => s.codePointAt(num(i, budget)),
  endsWith: (s: string, [v, end], budget) => {
    const suffix = asText(v, budget);
    budget.text(suffix.length);
    return s.endsWith(suffix, optNum(end, budget));
  },
  startsWith: (s: string, [v, position], budget) => {
    const prefix = asText(v, budget);
    budget.text(prefix.length);
    return s.startsWith(prefix, optNum(position, budget));
  },
  includes: (s: string, [v, position], budget) => {
    const pattern = asText(v, budget);
    chargeSearch(s, pattern, budget);
    return s.includes(pattern, optNum(position, budget));
  },
  indexOf: (s: string, [v, position], budget) => {
    const pattern = asText(v, budget);
    chargeSearch(s, pattern, budget);
    return s.indexOf(pattern, optNum(position, budget));
  },
  lastIndexOf: (s: string, [v, position], budget) => {
    const pattern = asText(v, budget);
    chargeSearch(s, pattern, budget);
    return s.lastIndexOf(pattern, optNum(position, budget));
  },
  normalize: (s: string, [form], budget) => markSafe(read(s, budget)).normalize(optString(form, budget)),
  padStart: (s: string, args, budget) => pad(s, args, budget, false),
  padEnd: (s: string, args, budget) => pad(s, args, budget, true),
  repeat: (s: string, [n], budget) => {
    const count = toInteger(n, budget);
    if (!Number.isFinite(count) || count < 0) return fail(`repeat count ${String(n)} is not valid`);
    budget.checkString(s.length * count);
    return s.repeat(count);
  },
  concat: (s: string, args, budget) => {
    const parts = args.map((arg) => asText(arg, budget));
    let length = s.length;
    for (const part of parts) length += part.length;
    budget.checkString(length);
    return s.concat(...parts);
  },
  // String patterns only. A regular expression would put ReDoS inside the regex engine, where no step counter can see it.
  replace: (s: string, [from, to], budget) => {
    const pattern = requireString(from, "replace");
    const replacement = asText(to, budget);
    chargeSearch(s, pattern, budget);
    budget.checkString(s.length + replacementGrowth(s, pattern, replacement, budget));
    return s.replace(pattern, replacement);
  },
  replaceAll: (s: string, [from, to], budget) => {
    const pattern = requireString(from, "replaceAll");
    const replacement = asText(to, budget);
    chargeSearch(s, pattern, budget);
    budget.checkString(s.length + occurrences(s, pattern) * replacementGrowth(s, pattern, replacement, budget));
    return s.replaceAll(pattern, replacement);
  },
  slice: (s: string, [start, end], budget) => s.slice(optNum(start, budget), optNum(end, budget)),
  substring: (s: string, [start, end], budget) => s.substring(num(start, budget), optNum(end, budget)),
  split: (s: string, [sep, limit], budget) => {
    const max = limit === undefined ? undefined : num(limit, budget) >>> 0;
    if (max === 0) return [];
    if (sep === undefined) return [s];
    const separator = requireString(sep, "split");
    chargeSearch(s, separator, budget);
    const parts = separator === "" ? s.length : occurrences(s, separator) + 1;
    budget.checkArray(max === undefined ? parts : Math.min(parts, max));
    return s.split(separator, max);
  },
  toLowerCase: (s: string, _args, budget) => read(s, budget).toLowerCase(),
  toUpperCase: (s: string, _args, budget) => read(s, budget).toUpperCase(),
  toLocaleLowerCase: (s: string, [locales], budget) => s.toLocaleLowerCase(caseLocales(s, locales, budget)),
  toLocaleUpperCase: (s: string, [locales], budget) => s.toLocaleUpperCase(caseLocales(s, locales, budget)),
  trim: (s: string, _args, budget) => read(s, budget).trim(),
  trimStart: (s: string, _args, budget) => read(s, budget).trimStart(),
  trimEnd: (s: string, _args, budget) => read(s, budget).trimEnd(),
  isWellFormed: (s: string, _args, budget) => loneSurrogate(read(s, budget), 0) === -1,
  toWellFormed: (s: string, _args, budget) => {
    read(s, budget);
    let out = "";
    let from = 0;
    for (let i = loneSurrogate(s, 0); i !== -1; i = loneSurrogate(s, i + 1)) {
      out += s.slice(from, i) + REPLACEMENT_CHARACTER;
      from = i + 1;
    }
    return from === 0 ? s : out + s.slice(from);
  },
  localeCompare: (s: string, [v, locales, options], budget) => {
    const other = asText(v, budget);
    budget.text(s.length + other.length);
    markSafe(s);
    markSafe(other);
    if (locales === undefined && options === undefined) return s.localeCompare(other);
    return collator(locales, options, budget).compare(s, other);
  },
});

// Without a locale or options, the engine's own default formatter.
const formatNumber = (n: number, [locales, options]: unknown[], budget: Budget): string => {
  if (locales === undefined && options === undefined) return n.toLocaleString();
  return numberFormat(locales, options, budget).format(n);
};

const NUMBER_METHODS: Methods = nullProto({
  valueOf: (n: number) => n,
  toFixed: (n: number, [digits], budget) => n.toFixed(optNum(digits, budget)),
  toExponential: (n: number, [digits], budget) => n.toExponential(optNum(digits, budget)),
  toPrecision: (n: number, [precision], budget) => n.toPrecision(optNum(precision, budget)),
  toString: (n: number, [radix]: unknown[], budget: Budget) => n.toString(optNum(radix, budget)),
  toLocaleString: formatNumber,
});

const MATH_OWN: Methods = {
  f16round: (_r, [x], budget) => f16round(num(x, budget)),
  sumPrecise: (_r, [items], budget) => {
    const list = itemsOf(items, "Math.sumPrecise", budget);
    budget.tick(list.length);
    return sumPrecise(list);
  },
};

const NAMESPACE_METHODS: Readonly<Record<string, Methods>> = nullProto({
  Math: nullProto({ ...nativeTable(Math, NAMESPACE_METHOD_NAMES.Math), ...MATH_OWN }),
  Number: nativeTable(Number, NAMESPACE_METHOD_NAMES.Number),
  String: nativeTable(String, NAMESPACE_METHOD_NAMES.String),
  Date: nullProto({
    ...nativeTable(Date, ["UTC"]),
    parse: (_r, [text], budget) => {
      chargeNumber(text, budget);
      return Date.parse(String(text));
    },
  }),
  JSON: nullProto({
    parse: (_r, [text], budget) => {
      const source = asText(text, budget);
      budget.text(source.length);
      return JSON.parse(source);
    },
    stringify: (_r, [value, replacer, space], budget) => {
      const globals = { found: false };
      const size = jsonSize(value, indentWidth(space, budget), 0, budget, globals);
      budget.checkString(size);
      // A function replacer would take a function, so it is dropped. An array one lists the keys each object prints, in
      // its order: its strings and numbers, each once, as JS builds the list.
      const keys = Array.isArray(replacer) ? replacerKeys(replacer, budget) : null;
      // With neither to handle, the engine's own fast path prints it.
      if (!keys && !globals.found) return JSON.stringify(value, null, space as string | number | undefined);
      return JSON.stringify(
        value,
        (_key: string, v: unknown) => {
          const out = asJson(v);
          if (!keys || out === null || typeof out !== "object" || !isPlainObject(out)) return out;
          budget.tick(keys.length);
          const obj = out as Record<string, unknown>;
          return Object.fromEntries(keys.filter((k) => Object.hasOwn(obj, k)).map((k) => [k, obj[k]]));
        },
        space as string | number | undefined,
      );
    },
  }),
  Object: nullProto({
    keys: (_r, [o]) => Object.keys(objectArg(o, "Object.keys")),
    values: (_r, [o]) => Object.values(objectArg(o, "Object.values")),
    entries: (_r, [o], budget) => {
      const entries = Object.entries(objectArg(o, "Object.entries"));
      budget.tick(entries.length);
      return entries;
    },
    fromEntries: (_r, [source], budget) => {
      const pairs = itemsOf(source, "Object.fromEntries", budget);
      const out: Record<string, unknown> = {};
      for (const pair of pairs) {
        budget.tick(1);
        if (!Array.isArray(pair)) return fail("Object.fromEntries needs [key, value] pairs");
        Object.defineProperty(out, asText(pair[0], budget), {
          value: pair[1],
          writable: true,
          enumerable: true,
          configurable: true,
        });
      }
      return out;
    },
    // Null-prototype, as in JS: a group named "__proto__" or "toString" is just a key.
    groupBy: (_r, [items, f], budget) => {
      const list = itemsOf(items, "Object.groupBy", budget);
      checkCallback(f);
      budget.array(list.length);
      const out: Record<string, unknown[]> = Object.create(null);
      for (let i = 0; i < list.length; i++) {
        const key = asText(invoke(f, list[i], i), budget);
        if (out[key] === undefined) out[key] = [list[i]];
        else out[key].push(list[i]);
      }
      return out;
    },
    hasOwn: (_r, [o, key], budget) => Object.hasOwn(objectArg(o, "Object.hasOwn"), asText(key, budget)),
    is: (_r, [a, b]) => Object.is(a, b),
  }),
  Array: nullProto({
    isArray: (_r, [v]) => Array.isArray(v),
    from: (_r, [source, mapper], budget) => {
      if (mapper !== undefined) checkCallback(mapper);
      const plain = typeof source === "object" && source !== null && isPlainObject(source);
      const base = plain ? arrayLike(source as Record<string, unknown>, budget) : itemsOf(source, "Array.from", budget);
      return mapper === undefined ? [...base] : base.map((v, i) => invoke(mapper, v, i));
    },
    of: (_r, items) => [...items],
  }),
});

export const methodsOf = (obj: unknown): Methods | undefined => {
  if (typeof obj === "string") return STRING_METHODS;
  if (typeof obj === "number") return NUMBER_METHODS;
  if (Array.isArray(obj)) return ARRAY_METHODS;
  if (obj instanceof Namespace) return NAMESPACE_METHODS[obj.name];
  return undefined;
};
