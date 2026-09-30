import type * as acorn from "acorn";
import { ExpressionError } from "../errors";
import type { Budget } from "../runtime/budget";
import { chargeCompare, chargeNumber, chargeText } from "../runtime/coerce";
import { callGlobal, lookupName, withGlobalCallback } from "../runtime/globals";
import { callMember, defineKey, getMember, getStaticMember, pushSpread, spreadInto } from "../runtime/membrane";
import { type HostFunction, Lambda, Namespace, typeOf } from "../runtime/values";
import { childNodes, patternNames } from "../syntax/ast";

// Identifiers resolve to (depth, slot) at compile time.
type Frame = {
  values: unknown[];
  parent: Frame | null;
};

type Lexical = readonly (readonly string[])[];

type Cx = { readonly lexical: Lexical; readonly tools: Record<string, HostFunction> };

// Contexts stay a list: one object spread per evaluation cost more than most expressions.
// `global` answers for a name no context has.
export type Runtime = {
  budget: Budget;
  contexts: readonly Record<string, unknown>[];
  global: (name: string) => unknown;
};

export type Thunk = (frame: Frame | null, rt: Runtime) => unknown;

// Marks a short-circuited optional chain, distinct from a real `undefined`.
const SHORT: unique symbol = Symbol("short-circuit");

// What a closure body costs the budget when it runs.
const nodeCount = (node: acorn.AnyNode): number => {
  let total = 1;
  for (const child of childNodes(node)) total += nodeCount(child);
  return total;
};

// Where a parameter lives: how many frames up, and its slot there. Null for a free name.
const slotOf = (name: string, lexical: Lexical): { depth: number; index: number } | null => {
  for (let depth = 0; depth < lexical.length; depth++) {
    const index = lexical[lexical.length - 1 - depth].lastIndexOf(name);
    if (index !== -1) return { depth, index };
  }
  return null;
};

const compileIdentifier = (name: string, lexical: Lexical): Thunk => {
  const slot = slotOf(name, lexical);
  // Host functions never get here: the validator allows them only as a callee, fused at compile time.
  if (slot === null) return (_frame, rt) => lookupName(name, rt.contexts, rt.global);
  const { depth, index } = slot;
  if (depth === 0) return (frame) => (frame as Frame).values[index];
  if (depth === 1) return (frame) => ((frame as Frame).parent as Frame).values[index];
  return (frame) => {
    let f = frame as Frame;
    for (let d = 0; d < depth; d++) f = f.parent as Frame;
    return f.values[index];
  };
};

// `row.status` on a callback's own parameter is the most common read there is, so it is one closure.
const compileStaticChain = (base: string, keys: readonly string[], lexical: Lexical): Thunk => {
  const slot = slotOf(base, lexical);
  if (slot?.depth === 0 && keys.length === 1) {
    const { index } = slot;
    const [key] = keys;
    return (frame) => getStaticMember((frame as Frame).values[index], key);
  }
  const root = compileIdentifier(base, lexical);
  if (keys.length === 1) {
    const [key] = keys;
    return (frame, rt) => getStaticMember(root(frame, rt), key);
  }
  return (frame, rt) => {
    let value = root(frame, rt);
    for (let i = 0; i < keys.length; i++) value = getStaticMember(value, keys[i]);
    return value;
  };
};

const propertyKey = (prop: Pick<acorn.Property, "key" | "computed">, cx: Cx): string | Thunk => {
  if (prop.computed) return compileNode(prop.key, cx);
  return prop.key.type === "Identifier" ? prop.key.name : String((prop.key as acorn.Literal).value);
};

type Binder = (value: unknown, frame: Frame, rt: Runtime) => void;
type PatternProp = { rest: Binder } | { key: string | Thunk; bind: Binder };
type PatternElement = { rest: Binder } | { bind: Binder } | null;

// Binds into the in-flight frame, so a default sees earlier parameters.
const compilePattern = (pattern: acorn.Pattern, cx: Cx): Binder => {
  switch (pattern.type) {
    case "Identifier":
      return (value, frame) => {
        frame.values.push(value);
      };
    case "AssignmentPattern": {
      const bind = compilePattern(pattern.left, cx);
      const fallback = compileNode(pattern.right, cx);
      return (value, frame, rt) => bind(value === undefined ? fallback(frame, rt) : value, frame, rt);
    }
    case "ObjectPattern": {
      const props: PatternProp[] = pattern.properties.map((prop) =>
        prop.type === "RestElement"
          ? { rest: compilePattern(prop.argument, cx) }
          : { key: propertyKey(prop, cx), bind: compilePattern(prop.value, cx) },
      );
      return (value, frame, rt) => {
        // JS refuses null and undefined even when the pattern reads no name.
        if (value === null || value === undefined) {
          throw new ExpressionError(`Cannot destructure ${value}`, "expression-runtime");
        }
        const taken: string[] = [];
        for (const prop of props) {
          if ("rest" in prop) {
            const rest: Record<string, unknown> = {};
            spreadInto(rest, value, rt.budget);
            for (const key of taken) delete rest[key];
            prop.rest(rest, frame, rt);
          } else {
            const key = typeof prop.key === "string" ? prop.key : prop.key(frame, rt);
            const bound = getMember(value, key);
            taken.push(String(key));
            prop.bind(bound, frame, rt);
          }
        }
      };
    }
    case "ArrayPattern": {
      const elements: PatternElement[] = pattern.elements.map((element) => {
        if (element === null) return null;
        if (element.type === "RestElement") return { rest: compilePattern(element.argument, cx) };
        return { bind: compilePattern(element, cx) };
      });
      return (value, frame, rt) => {
        if (!Array.isArray(value) && typeof value !== "string") {
          throw new ExpressionError("Only arrays and strings can be destructured positionally", "expression-runtime");
        }
        let items: unknown[];
        if (typeof value === "string") {
          rt.budget.array(value.length);
          items = [...value];
        } else items = value;
        for (let i = 0; i < elements.length; i++) {
          const element = elements[i];
          if (element === null) continue;
          if ("rest" in element) {
            const rest = items.slice(i);
            rt.budget.array(rest.length);
            element.rest(rest, frame, rt);
          } else if (typeof items[i] === "function") {
            throw new ExpressionError(`Item ${i} holds a function, which cannot be read in an expression`);
          } else element.bind(items[i], frame, rt);
        }
      };
    }
    default:
      throw new ExpressionError(`"${pattern.type}" is not allowed in a parameter list`);
  }
};

const HOLE: Thunk = () => undefined;

type ListThunk = (frame: Frame | null, rt: Runtime) => unknown[];

// A hole is `undefined`.
const compileList = (items: readonly (acorn.Expression | acorn.SpreadElement | null)[], cx: Cx): ListThunk => {
  // Most argument lists are one plain expression or none.
  if (items.length === 0) return () => [];
  const [only] = items;
  if (items.length === 1 && only !== null && only.type !== "SpreadElement") {
    const thunk = compileNode(only, cx);
    return (frame, rt) => [thunk(frame, rt)];
  }
  const parts = items.map((item) => ({
    thunk: item === null ? HOLE : compileNode(item.type === "SpreadElement" ? item.argument : item, cx),
    spread: item !== null && item.type === "SpreadElement",
  }));
  return (frame, rt) => {
    const out: unknown[] = [];
    for (let i = 0; i < parts.length; i++) {
      const value = parts[i].thunk(frame, rt);
      if (parts[i].spread) pushSpread(out, value, rt.budget);
      else out.push(value);
    }
    return out;
  };
};

type BinaryFn = (l: unknown, r: unknown, budget: Budget) => unknown;

// The engine converts a non-number operand in time of its length, so each operator charges that first.
const chargeArithmetic = (l: unknown, r: unknown, budget: Budget): void => {
  if (typeof l === "number" && typeof r === "number") return;
  chargeNumber(l, budget);
  chargeNumber(r, budget);
};
const chargeRelational = (l: unknown, r: unknown, budget: Budget): void => {
  if (typeof l !== "number" || typeof r !== "number") chargeCompare(l, r, budget);
};
// `x == null` converts nothing.
const chargeEquality = (l: unknown, r: unknown, budget: Budget): void => {
  if (l !== null && l !== undefined && r !== null && r !== undefined) chargeCompare(l, r, budget);
};

export const BINARY_FNS: Record<string, BinaryFn> = {
  // The one polymorphic operator: string concatenation or numeric addition. An array operand joins first.
  "+": (l, r, budget) => {
    if (typeof l === "object" || typeof r === "object") {
      chargeText(l, budget);
      chargeText(r, budget);
    }
    const out: unknown = (l as number) + (r as number);
    if (typeof out === "string") budget.string(out.length);
    return out;
  },
  "-": (l, r, budget) => {
    chargeArithmetic(l, r, budget);
    return (l as number) - (r as number);
  },
  "*": (l, r, budget) => {
    chargeArithmetic(l, r, budget);
    return (l as number) * (r as number);
  },
  "/": (l, r, budget) => {
    chargeArithmetic(l, r, budget);
    return (l as number) / (r as number);
  },
  "%": (l, r, budget) => {
    chargeArithmetic(l, r, budget);
    return (l as number) % (r as number);
  },
  "**": (l, r, budget) => {
    chargeArithmetic(l, r, budget);
    return (l as number) ** (r as number);
  },
  "==": (l, r, budget) => {
    chargeEquality(l, r, budget);
    // biome-ignore lint/suspicious/noDoubleEquals: implementing JS's `==` is the point
    return l == r;
  },
  "!=": (l, r, budget) => {
    chargeEquality(l, r, budget);
    // biome-ignore lint/suspicious/noDoubleEquals: implementing JS's `!=` is the point
    return l != r;
  },
  "===": (l, r) => l === r,
  "!==": (l, r) => l !== r,
  "<": (l, r, budget) => {
    chargeRelational(l, r, budget);
    return (l as number) < (r as number);
  },
  "<=": (l, r, budget) => {
    chargeRelational(l, r, budget);
    return (l as number) <= (r as number);
  },
  ">": (l, r, budget) => {
    chargeRelational(l, r, budget);
    return (l as number) > (r as number);
  },
  ">=": (l, r, budget) => {
    chargeRelational(l, r, budget);
    return (l as number) >= (r as number);
  },
};

// The same closure for every operator would share one call site, too polymorphic for the engine to inline.
// Written once per operator, each call site sees one function.
const binaryThunk = (op: string, left: Thunk, right: Thunk): Thunk => {
  const fn = BINARY_FNS[op];
  switch (op) {
    case "===":
      return (f, rt) => left(f, rt) === right(f, rt);
    case "!==":
      return (f, rt) => left(f, rt) !== right(f, rt);
    case "+":
      return (f, rt) => fn(left(f, rt), right(f, rt), rt.budget);
    case "-":
      return (f, rt) => fn(left(f, rt), right(f, rt), rt.budget);
    case "*":
      return (f, rt) => fn(left(f, rt), right(f, rt), rt.budget);
    case "/":
      return (f, rt) => fn(left(f, rt), right(f, rt), rt.budget);
    case "<":
      return (f, rt) => fn(left(f, rt), right(f, rt), rt.budget);
    case "<=":
      return (f, rt) => fn(left(f, rt), right(f, rt), rt.budget);
    case ">":
      return (f, rt) => fn(left(f, rt), right(f, rt), rt.budget);
    case ">=":
      return (f, rt) => fn(left(f, rt), right(f, rt), rt.budget);
    default:
      return (f, rt) => fn(left(f, rt), right(f, rt), rt.budget);
  }
};

type UnaryFn = (v: unknown, budget: Budget) => unknown;

export const UNARY_FNS: Record<string, UnaryFn> = {
  "!": (v) => !v,
  "-": (v, budget) => {
    if (typeof v !== "number") chargeNumber(v, budget);
    return -(v as number);
  },
  "+": (v, budget) => {
    if (typeof v !== "number") chargeNumber(v, budget);
    return +(v as number);
  },
  typeof: typeOf,
};

export const compileAst = (ast: acorn.Expression, tools: Record<string, HostFunction>): Thunk => {
  const body = compileNode(ast, { lexical: [], tools });
  // Straight-line work charged once; a callback body is charged again per invocation.
  const cost = nodeCount(ast);
  return (frame, rt) => {
    rt.budget.tick(cost);
    return body(frame, rt);
  };
};

const compileNode = (node: acorn.AnyNode, cx: Cx): Thunk => {
  switch (node.type) {
    case "Literal": {
      const value = node.value;
      return () => value;
    }

    case "Identifier":
      return compileIdentifier(node.name, cx.lexical);

    case "TemplateLiteral": {
      const quasis = node.quasis.map((q) => q.value.cooked ?? "");
      if (node.expressions.length === 0) {
        const only = quasis[0];
        return () => only;
      }
      const evalParts = compileList(node.expressions, cx);
      return (frame, rt) => {
        const values = evalParts(frame, rt);
        let out = quasis[0];
        for (let i = 0; i < values.length; i++) {
          // "null" and "undefined" print as in JS.
          chargeText(values[i], rt.budget);
          const piece = String(values[i]) + quasis[i + 1];
          rt.budget.growString(out.length + piece.length, piece.length);
          out += piece;
        }
        return out;
      };
    }

    case "ChainExpression": {
      const inner = compileNode(node.expression, cx);
      return (frame, rt) => {
        const v = inner(frame, rt);
        return v === SHORT ? undefined : v;
      };
    }

    case "MemberExpression": {
      // A plain `a.b.c` chain is one closure over a key array: the most common shape by far.
      if (!node.computed && !node.optional) {
        const keys: string[] = [];
        let base: acorn.AnyNode = node;
        while (
          base.type === "MemberExpression" &&
          !base.computed &&
          !base.optional &&
          base.property.type === "Identifier"
        ) {
          keys.unshift(base.property.name);
          base = base.object;
        }
        if (base.type === "Identifier") return compileStaticChain(base.name, keys, cx.lexical);
        const baseThunk = compileNode(base, cx);
        return (frame, rt) => {
          let value = baseThunk(frame, rt);
          if (value === SHORT) return SHORT;
          for (let i = 0; i < keys.length; i++) value = getStaticMember(value, keys[i]);
          return value;
        };
      }

      const object = compileNode(node.object, cx);

      // Only `a?.b` gets here: the plain chain returned above.
      if (!node.computed) {
        const key = (node.property as acorn.Identifier).name;
        return (frame, rt) => {
          const o = object(frame, rt);
          if (o === SHORT || o === null || o === undefined) return SHORT;
          return getStaticMember(o, key);
        };
      }

      const property = compileNode(node.property, cx);
      const optional = node.optional;
      return (frame, rt) => {
        const o = object(frame, rt);
        if (o === SHORT) return SHORT;
        if (optional && (o === null || o === undefined)) return SHORT;
        return getMember(o, property(frame, rt));
      };
    }

    case "CallExpression": {
      const evalArgs = compileList(node.arguments, cx);

      // Receiver and key stay together, so no method is ever a standalone value.
      if (node.callee.type === "MemberExpression") {
        const callee = node.callee;
        const object = compileNode(callee.object, cx);
        const keyThunk = callee.computed ? compileNode(callee.property, cx) : null;
        const staticKey = callee.computed ? null : (callee.property as acorn.Identifier).name;
        const optional = callee.optional;

        return (frame, rt) => {
          const o = object(frame, rt);
          if (o === SHORT) return SHORT;
          if (optional && (o === null || o === undefined)) return SHORT;
          const key = keyThunk ? keyThunk(frame, rt) : staticKey;
          return callMember(o, key, withGlobalCallback(key, evalArgs(frame, rt), rt.budget), rt.budget);
        };
      }

      const calleeName = node.callee.type === "Identifier" ? node.callee.name : null;
      // The validator allows a host function only here, so the call binds now.
      if (calleeName !== null && slotOf(calleeName, cx.lexical) === null && cx.tools[calleeName] !== undefined) {
        const fn = cx.tools[calleeName];
        return (frame, rt) => fn(evalArgs(frame, rt)[0]);
      }
      // Only a callable global gets here: a function is never a value, so there is nothing else to call.
      const callee = compileNode(node.callee, cx);
      return (frame, rt) => {
        const f = callee(frame, rt);
        if (f === SHORT) return SHORT;
        if (f instanceof Namespace) return callGlobal(f.name, evalArgs(frame, rt), rt.budget);
        throw new ExpressionError(
          calleeName ? `"${calleeName}" is not a function` : "This expression is not callable",
          "expression-runtime",
        );
      };
    }

    case "UnaryExpression": {
      const argument = compileNode(node.argument, cx);
      const fn = UNARY_FNS[node.operator];
      return (frame, rt) => fn(argument(frame, rt), rt.budget);
    }

    case "BinaryExpression":
      return binaryThunk(node.operator, compileNode(node.left, cx), compileNode(node.right, cx));

    case "LogicalExpression": {
      const left = compileNode(node.left, cx);
      const right = compileNode(node.right, cx);
      const op = node.operator;
      if (op === "&&")
        return (frame, rt) => {
          const l = left(frame, rt);
          return l ? right(frame, rt) : l;
        };
      if (op === "||")
        return (frame, rt) => {
          const l = left(frame, rt);
          return l ? l : right(frame, rt);
        };
      return (frame, rt) => {
        const l = left(frame, rt);
        return l === null || l === undefined ? right(frame, rt) : l;
      };
    }

    case "ConditionalExpression": {
      const test = compileNode(node.test, cx);
      const consequent = compileNode(node.consequent, cx);
      const alternate = compileNode(node.alternate, cx);
      return (frame, rt) => (test(frame, rt) ? consequent(frame, rt) : alternate(frame, rt));
    }

    case "ArrayExpression": {
      const evalParts = compileList(node.elements, cx);
      return (frame, rt) => {
        const values = evalParts(frame, rt);
        rt.budget.array(values.length);
        return values;
      };
    }

    case "ObjectExpression": {
      type Entry = { spread: true; value: Thunk } | { spread: false; key: string | Thunk; value: Thunk };
      const entries: Entry[] = node.properties.map((prop) =>
        prop.type === "SpreadElement"
          ? { spread: true, value: compileNode(prop.argument, cx) }
          : { spread: false, key: propertyKey(prop, cx), value: compileNode(prop.value, cx) },
      );
      return (frame, rt) => {
        const out: Record<string, unknown> = {};
        for (let i = 0; i < entries.length; i++) {
          const entry = entries[i];
          if (entry.spread) {
            spreadInto(out, entry.value(frame, rt), rt.budget);
          } else if (typeof entry.key === "string") {
            // A written key already passed the validator's `__proto__` check.
            out[entry.key] = entry.value(frame, rt);
          } else {
            defineKey(out, entry.key(frame, rt), entry.value(frame, rt));
          }
        }
        return out;
      };
    }

    case "ArrowFunctionExpression": {
      const params = node.params;
      const boundNames: string[] = [];
      for (const param of params) patternNames(param, boundNames);
      const inner: Cx = { lexical: [...cx.lexical, boundNames], tools: cx.tools };
      const body = compileNode(node.body, inner);
      // Destructuring reads are membrane reads too.
      const cost = nodeCount(node);
      // Charged before binding: a default value is work too.
      const run = (frame: Frame, rt: Runtime, bindParams?: () => void): unknown => {
        rt.budget.tick(cost);
        bindParams?.();
        return body(frame, rt);
      };

      // Plain names skip pattern binding: the call slots are the frame.
      if (params.every((p) => p.type === "Identifier")) {
        switch (params.length) {
          case 0:
            return (frame, rt) => new Lambda(() => run({ values: [], parent: frame }, rt));
          case 1:
            return (frame, rt) => new Lambda((a) => run({ values: [a], parent: frame }, rt));
          case 2:
            return (frame, rt) => new Lambda((a, b) => run({ values: [a, b], parent: frame }, rt));
          case 3:
            return (frame, rt) => new Lambda((a, b, c) => run({ values: [a, b, c], parent: frame }, rt));
          case 4:
            return (frame, rt) => new Lambda((a, b, c, d) => run({ values: [a, b, c, d], parent: frame }, rt));
          default:
            return (frame, rt) => new Lambda((a, b, c, d, e) => run({ values: [a, b, c, d, e], parent: frame }, rt));
        }
      }

      const binders = params.map((param) => compilePattern(param, inner));
      return (frame, rt) =>
        new Lambda((a, b, c, d, e) => {
          const inFlight: Frame = { values: [], parent: frame };
          const args = [a, b, c, d, e];
          return run(inFlight, rt, () => {
            for (let i = 0; i < binders.length; i++) binders[i](args[i], inFlight, rt);
          });
        });
    }

    default:
      throw new ExpressionError(`"${node.type}" is not part of the expression language`);
  }
};
