import type * as acorn from "acorn";
import { ExpressionError } from "../errors";
import type { Budget } from "../runtime/budget";
import { callGlobal, GLOBAL_VALUES } from "../runtime/globals";
import { callMember, construct, defineKey, getMember, getStaticMember, pushSpread, spreadInto } from "../runtime/membrane";
import { type HostFunction, Lambda, Namespace, typeOf } from "../runtime/values";
import { childNodes, patternNames } from "../syntax/ast";

// The AST is walked once into a tree of closures; evaluation is then nested calls, no per-node dispatch.
// Operators and budget costs are resolved at compile time.

// Lexical frame: value slots in binding order. Identifiers resolve to (depth, slot) at compile time.
type Frame = {
	values: unknown[];
	parent: Frame | null;
};

// The names bound by each enclosing arrow, innermost last.
type Lexical = readonly (readonly string[])[];

const isBound = (name: string, lexical: Lexical): boolean => lexical.some((names) => names.includes(name));

// What compilation needs besides the node: the enclosing arrows' names, and the host functions —
// a call to one resolves here, not at run time.
type Cx = { readonly lexical: Lexical; readonly tools: Record<string, HostFunction> };

// Per-evaluation state. Contexts stay a list — one object spread per evaluation cost more than most expressions.
export type Runtime = {
	budget: Budget;
	contexts: readonly Record<string, unknown>[];
};

export type Thunk = (frame: Frame | null, rt: Runtime) => unknown;

// Marks a short-circuited optional chain, distinct from a real `undefined`.
const SHORT: unique symbol = Symbol("short-circuit");

// Node count of a subtree — what a closure body costs the budget when it runs.
const nodeCount = (node: acorn.AnyNode): number => {
	let total = 1;
	for (const child of childNodes(node)) total += nodeCount(child);
	return total;
};

// A name no arrow binds: the contexts, last one first, then the built-ins.
// Host functions never get here — the validator allows them only as a callee, which is fused at compile time.
const freeLookup = (name: string, rt: Runtime): unknown => {
	const contexts = rt.contexts;
	for (let i = contexts.length - 1; i >= 0; i--) {
		if (Object.hasOwn(contexts[i], name)) return contexts[i][name];
	}
	if (Object.hasOwn(GLOBAL_VALUES, name)) return GLOBAL_VALUES[name];
	throw new ExpressionError(`"${name}" is not available in expressions`, "unknown-reference");
};

// Compile an identifier to a direct slot read, or a context lookup if free.
const compileIdentifier = (name: string, lexical: Lexical): Thunk => {
	for (let depth = 0; depth < lexical.length; depth++) {
		const names = lexical[lexical.length - 1 - depth];
		const index = names.lastIndexOf(name);
		if (index === -1) continue;
		if (depth === 0) return (frame) => (frame as Frame).values[index];
		if (depth === 1) return (frame) => ((frame as Frame).parent as Frame).values[index];
		return (frame) => {
			let f = frame as Frame;
			for (let d = 0; d < depth; d++) f = f.parent as Frame;
			return f.values[index];
		};
	}
	return (_frame, rt) => freeLookup(name, rt);
};

// An object key: a written name, or a thunk for a computed one.
const propertyKey = (prop: Pick<acorn.Property, "key" | "computed">, cx: Cx): string | Thunk => {
	if (prop.computed) return compileNode(prop.key as acorn.Expression, cx);
	return prop.key.type === "Identifier" ? prop.key.name : String((prop.key as acorn.Literal).value);
};

type Binder = (value: unknown, frame: Frame, rt: Runtime) => void;
type PatternProp = { rest: Binder } | { key: string | Thunk; bind: Binder };
type PatternElement = { rest: Binder } | { bind: Binder } | null;

// A parameter pattern, compiled to the reads it performs. Binds into the in-flight frame, so a default sees earlier parameters.
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
					: { key: propertyKey(prop, cx), bind: compilePattern(prop.value as acorn.Pattern, cx) },
			);
			return (value, frame, rt) => {
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
			const elements: PatternElement[] = pattern.elements.map((element) =>
				element === null
					? null
					: element.type === "RestElement"
						? { rest: compilePattern(element.argument, cx) }
						: { bind: compilePattern(element, cx) },
			);
			return (value, frame, rt) => {
				if (!Array.isArray(value) && typeof value !== "string") {
					throw new ExpressionError("Only arrays and strings can be destructured positionally", "runtime");
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
					} else element.bind(items[i], frame, rt);
				}
			};
		}
		default:
			throw new ExpressionError(`"${pattern.type}" is not allowed in a parameter list`);
	}
};

const HOLE: Thunk = () => undefined;

// Evaluate a list left to right, flattening spreads; a hole is `undefined`.
const compileList = (
	items: readonly (acorn.Expression | acorn.SpreadElement | null)[],
	cx: Cx,
): ((frame: Frame | null, rt: Runtime) => unknown[]) => {
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

// `+` is the one polymorphic operator: string concatenation or numeric addition.
const plus: BinaryFn = (l, r, budget) => {
	const out: unknown = (l as number) + (r as unknown as number);
	if (typeof out === "string") budget.string(out.length);
	return out;
};

const BINARY_FNS: Record<string, BinaryFn> = {
	"+": plus,
	"-": (l, r) => (l as number) - (r as number),
	"*": (l, r) => (l as number) * (r as number),
	"/": (l, r) => (l as number) / (r as number),
	"%": (l, r) => (l as number) % (r as number),
	"**": (l, r) => (l as number) ** (r as number),
	// biome-ignore lint/suspicious/noDoubleEquals: implementing JS's `==` is the point
	"==": (l, r) => l == r,
	// biome-ignore lint/suspicious/noDoubleEquals: implementing JS's `!=` is the point
	"!=": (l, r) => l != r,
	"===": (l, r) => l === r,
	"!==": (l, r) => l !== r,
	"<": (l, r) => (l as number) < (r as number),
	"<=": (l, r) => (l as number) <= (r as number),
	">": (l, r) => (l as number) > (r as number),
	">=": (l, r) => (l as number) >= (r as number),
};

type UnaryFn = (v: unknown) => unknown;

const UNARY_FNS: Record<string, UnaryFn> = {
	"!": (v) => !v,
	"-": (v) => -(v as number),
	"+": (v) => +(v as number),
	typeof: typeOf,
};

export const compileAst = (ast: acorn.Expression, tools: Record<string, HostFunction>): Thunk => {
	const body = compileNode(ast, { lexical: [], tools });
	// The whole expression's straight-line work, charged once. What a callback body costs is charged again per invocation, where it belongs.
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
					// Plain JS stringification, "null" and "undefined" included — a friendlier blank would be a silent divergence; the document writes `?? ""`.
					const piece = String(values[i]) + (quasis[i + 1] ?? "");
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
			// Fused fast path: a plain `a.b.c` chain becomes one closure over a key array — the most common expression shape by far.
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
				if (base.type === "Identifier") {
					const root = compileIdentifier(base.name, cx.lexical);
					return (frame, rt) => {
						let value = root(frame, rt);
						for (let i = 0; i < keys.length; i++) value = getStaticMember(value, keys[i]);
						return value;
					};
				}
				const baseThunk = compileNode(base, cx);
				return (frame, rt) => {
					let value = baseThunk(frame, rt);
					if (value === SHORT) return SHORT;
					for (let i = 0; i < keys.length; i++) value = getStaticMember(value, keys[i]);
					return value;
				};
			}

			const object = compileNode(node.object, cx);
			const optional = node.optional;

			if (!node.computed) {
				const key = node.property.type === "Identifier" ? node.property.name : String((node.property as acorn.Literal).value);
				return (frame, rt) => {
					const o = object(frame, rt);
					if (o === SHORT) return SHORT;
					if (optional && (o === null || o === undefined)) return SHORT;
					return getStaticMember(o, key);
				};
			}

			const property = compileNode(node.property, cx);
			return (frame, rt) => {
				const o = object(frame, rt);
				if (o === SHORT) return SHORT;
				if (optional && (o === null || o === undefined)) return SHORT;
				return getMember(o, property(frame, rt));
			};
		}

		case "CallExpression": {
			const evalArgs = compileList(node.arguments, cx);
			const optional = node.optional;

			// A method call: the receiver and the key stay together, so no method is ever produced as a standalone value that could be re-bound.
			if (node.callee.type === "MemberExpression") {
				const callee = node.callee;
				const object = compileNode(callee.object, cx);
				const keyThunk = callee.computed ? compileNode(callee.property, cx) : null;
				const staticKey = callee.computed
					? null
					: callee.property.type === "Identifier"
						? callee.property.name
						: String((callee.property as acorn.Literal).value);
				const shortCircuits = callee.optional || optional;

				return (frame, rt) => {
					const o = object(frame, rt);
					if (o === SHORT) return SHORT;
					if (shortCircuits && (o === null || o === undefined)) return SHORT;
					const key = keyThunk ? keyThunk(frame, rt) : staticKey;
					return callMember(o, key, evalArgs(frame, rt), rt.budget);
				};
			}

			const calleeName = node.callee.type === "Identifier" ? node.callee.name : null;
			// A host function: the validator allows it only here, with 0 or 1 argument, so the call binds now and the name never resolves at run time.
			if (calleeName !== null && !isBound(calleeName, cx.lexical) && cx.tools[calleeName] !== undefined) {
				const fn = cx.tools[calleeName];
				return (frame, rt) => fn(evalArgs(frame, rt)[0]);
			}
			const callee = compileNode(node.callee as acorn.Expression, cx);
			return (frame, rt) => {
				const f = callee(frame, rt);
				if (f === SHORT) return SHORT;
				if (optional && (f === null || f === undefined)) return SHORT;
				const args = evalArgs(frame, rt);
				if (f instanceof Lambda) return f.call(args[0], args[1], args[2], args[3], args[4]);
				if (f instanceof Namespace) return callGlobal(f.name, args, rt.budget);
				throw new ExpressionError(
					calleeName ? `"${calleeName}" is not a function` : "This expression is not callable",
					"runtime",
				);
			};
		}

		case "NewExpression": {
			const callee = compileNode(node.callee as acorn.Expression, cx);
			const evalArgs = compileList(node.arguments, cx);
			return (frame, rt) => construct(callee(frame, rt), evalArgs(frame, rt), rt.budget);
		}

		case "UnaryExpression": {
			const argument = compileNode(node.argument, cx);
			const fn = UNARY_FNS[node.operator];
			if (!fn) throw new ExpressionError(`The "${node.operator}" operator is not allowed`);
			return (frame, rt) => fn(argument(frame, rt));
		}

		case "BinaryExpression": {
			const left = compileNode(node.left as acorn.Expression, cx);
			const right = compileNode(node.right, cx);
			const fn = BINARY_FNS[node.operator];
			if (!fn) throw new ExpressionError(`The "${node.operator}" operator is not allowed`);
			return (frame, rt) => fn(left(frame, rt), right(frame, rt), rt.budget);
		}

		case "LogicalExpression": {
			const left = compileNode(node.left, cx);
			const right = compileNode(node.right, cx);
			const op = node.operator;
			if (op === "&&") return (frame, rt) => {
				const l = left(frame, rt);
				return l ? right(frame, rt) : l;
			};
			if (op === "||") return (frame, rt) => {
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
					: { spread: false, key: propertyKey(prop, cx), value: compileNode(prop.value as acorn.Expression, cx) },
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
			const body = compileNode(node.body as acorn.Expression, inner);
			// One invocation costs the whole arrow, parameters included — destructuring reads are membrane reads too.
			const cost = nodeCount(node);
			// Charge and enter before binding: a default value can call back into the expression.
			const run = (frame: Frame, rt: Runtime, bindParams?: () => void): unknown => {
				const budget = rt.budget;
				budget.tick(cost);
				budget.enter();
				bindParams?.();
				const out = body(frame, rt);
				budget.depth--;
				return out;
			};

			// Plain names — nearly every arrow — skip pattern binding: the call slots are the frame.
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
