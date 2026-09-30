import fc from "fast-check";
import { expect, it } from "vitest";
import { Evaluator } from "../index";

// corpus.test.ts pins chosen cases; this runs random ones. Receivers are typed: reading a name on a number,
// or a string key on an array, is refused by design where JS answers undefined.

const SCOPES = {
  root: {
    n: 3,
    s: "ab",
    xs: [2, -1, 0.5],
    o: { a: 1, b: "x" },
    rows: [
      { a: 2, b: "y" },
      { a: -1, b: "" },
    ],
    nil: null,
  },
};
// x, y and r are the callbacks' parameters; outside a callback they read these.
const CONTEXT = { scopes: SCOPES, x: 2, y: "1", r: { a: 0, b: "r" } };

const ev = new Evaluator();
const plainJs = (source: string): unknown =>
  new Function(...Object.keys(CONTEXT), `"use strict"; return (${source})`)(...Object.values(CONTEXT));

// A throw is a throw: the messages differ by design.
const attempt = (run: () => unknown) => {
  try {
    return { value: run() };
  } catch {
    return { threw: true };
  }
};

// Source text from a template whose holes are arbitraries.
const code = (parts: TemplateStringsArray, ...holes: fc.Arbitrary<string>[]) =>
  fc.tuple(...holes).map((values) => parts.reduce((out, part, i) => out + values[i - 1] + part));

const text = fc.string({ unit: fc.constantFrom("a", "b", "1", " ", "-"), maxLength: 3 });
const nullish = fc.constantFrom("null", "undefined", "scopes.root.nil");
const leaf = {
  num: fc.oneof(fc.nat({ max: 10 }).map(String), fc.constantFrom("0.5", "1e21", "NaN", "Infinity", "scopes.root.n")),
  str: fc.oneof(
    text.map((t) => JSON.stringify(t)),
    fc.constant("scopes.root.s"),
  ),
  bool: fc.constantFrom("true", "false"),
  arr: fc.constantFrom("[]", "scopes.root.xs", "scopes.root.rows"),
  obj: fc.constantFrom("scopes.root.o", "r"),
};

type Sort = "expr" | "any" | "misc" | "num" | "str" | "bool" | "arr" | "obj";
const { expr } = fc.letrec<Record<Sort, string>>((tie) => {
  const [any, misc, num, str, bool, arr, obj] = (["any", "misc", "num", "str", "bool", "arr", "obj"] as const).map(
    (sort) => tie(sort),
  );
  // Three levels of operators keep a source under 800 characters.
  const node = (...arbs: fc.Arbitrary<string>[]) =>
    fc.oneof({ depthIdentifier: "expr", maxDepth: 3, withCrossShrink: true }, ...arbs);
  const seq = fc.oneof(arr, str);
  const fn = fc.oneof(code`${fc.constantFrom("x", "y")} => ${any}`, fc.constantFrom("Number", "String", "Boolean"));
  return {
    expr: fc.oneof(misc, num, str, bool, arr, obj),
    // A bare nullish value or parameter only as an operand: alone it tests nothing.
    any: fc.oneof(misc, num, str, bool, arr, obj, nullish, fc.constantFrom("x", "y")),
    misc: node(
      nullish,
      code`(${any} + ${any})`,
      code`(${any} ${fc.constantFrom("&&", "||", "??")} ${any})`,
      code`(${any} ? ${any} : ${any})`,
      code`(${fc.oneof(obj, nullish)})${fc.constantFrom(".", "?.")}${fc.constantFrom("a", "b", "c")}`,
      code`(${seq})[${num}]`,
      code`(${seq}).${fc.constantFrom("slice", "at", "concat")}(${any})`,
      code`(${arr}).${fc.constantFrom("find", "findLast")}(${fn})`,
      code`(${arr}).reduce((x, y) => ${any}, ${any})`,
    ),
    num: node(
      leaf.num,
      code`(${any} ${fc.constantFrom("-", "*", "/", "%", "**")} ${any})`,
      code`(${fc.constantFrom("-", "+")}${any})`,
      code`(${seq}).length`,
      code`(${seq}).${fc.constantFrom("indexOf", "lastIndexOf")}(${any})`,
      code`(${arr}).${fc.constantFrom("findIndex", "findLastIndex")}(${fn})`,
    ),
    str: node(leaf.str, code`\`${text}\${${any}}${text}\``, code`(typeof ${any})`, code`(${arr}).join(${str})`),
    bool: node(
      leaf.bool,
      code`(${any} ${fc.constantFrom("<", "<=", ">", ">=", "==", "!=", "===", "!==")} ${any})`,
      code`(!${any})`,
      code`(${seq}).includes(${any})`,
      code`(${arr}).${fc.constantFrom("some", "every")}(${fn})`,
    ),
    arr: node(
      leaf.arr,
      fc.array(fc.oneof(any, code`...${seq}`), { maxLength: 3 }).map((items) => `[${items.join(", ")}]`),
      code`(${arr}).${fc.constantFrom("map", "filter", "flatMap")}(${fn})`,
      code`scopes.root.rows.${fc.constantFrom("map", "filter")}(r => ${any})`,
      code`(${arr}).${fc.constantFrom("toSorted", "toReversed", "flat")}()`,
      code`(${arr}).toSorted((x, y) => ${any})`,
      code`(${str}).split(${str})`,
    ),
    obj: node(leaf.obj, code`({ a: ${any}, b: ${any} })`, code`({ ...${obj}, [${str}]: ${any} })`),
  };
});

it("agrees with plain JavaScript on random expressions", () => {
  fc.assert(
    fc.property(expr, (source) => {
      // A refused source would pass as a throw on both sides.
      ev.validate(source);
      // Object.is per value: NaN matches NaN, -0 does not match 0.
      expect(attempt(() => ev.eval(source, CONTEXT))).toStrictEqual(attempt(() => plainJs(source)));
    }),
    { numRuns: 300 },
  );
});
