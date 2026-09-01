import type * as acorn from "acorn";
import type { Budget } from "../budget";
import { ExpressionError } from "../errors";
import { CALLABLE_GLOBALS, GLOBAL_VALUES } from "../globals";
import {
	callMember,
	construct,
	defineKey,
	getMember,
	getStaticMember,
	HostFn,
	Lambda,
	Namespace,
	pushSpread,
	spreadInto,
} from "../membrane";

// The interpreting back end. The AST is walked once, into a tree of closures;
// evaluating afterwards is nested function calls — no dispatch per node per
// evaluation. Operators and budget costs are resolved at compile time.

/**
 * Lexical frame. Identifiers resolve to a (depth, slot) pair at compile time —
 * the runtime frame is just the value slots, in binding order.
 */
type Frame = {
	values: unknown[];
	parent: Frame | null;
};

/** Per-evaluation state. `functions` and `globals` stay unmerged — one object
 * spread per evaluation cost more than most expressions. */
export type Runtime = {
	budget: Budget;
	context: Record<string, unknown>;
	functions?: Record<string, unknown>;
	globals?: Record<string, unknown>;
};

export type Thunk = (frame: Frame | null, rt: Runtime) => unknown;

/** Marks a short-circuited optional chain, distinct from a real `undefined`. */
const SHORT: unique symbol = Symbol("short-circuit");

const isNode = (v: unknown): v is acorn.AnyNode =>
	typeof v === "object" && v !== null && typeof (v as acorn.AnyNode).type === "string";

const children = function* (node: acorn.AnyNode): Generator<acorn.AnyNode> {
	for (const key of Object.keys(node)) {
		if (key === "type" || key === "start" || key === "end") continue;
		const child = (node as unknown as Record<string, unknown>)[key];
		if (Array.isArray(child)) {
			for (const item of child) if (isNode(item)) yield item;
		} else if (isNode(child)) {
			yield child;
		}
	}
};

/** Node count of a subtree — what a closure body costs the budget when it runs. */
const nodeCount = (node: acorn.AnyNode): number => {
	let total = 1;
	for (const child of children(node)) total += nodeCount(child);
	return total;
};

/** A name no arrow binds. Precedence: host functions > context > host globals > built-ins. */
const freeLookup = (name: string, rt: Runtime): unknown => {
	if (rt.functions !== undefined && Object.hasOwn(rt.functions, name)) {
		return rt.functions[name];
	}
	if (Object.hasOwn(rt.context, name)) return rt.context[name];
	if (rt.globals !== undefined && Object.hasOwn(rt.globals, name)) return rt.globals[name];
	if (Object.hasOwn(GLOBAL_VALUES, name)) return GLOBAL_VALUES[name];
	throw new ExpressionError(`"${name}" is not available in expressions`, "unknown-reference");
};

/** Compile-time twin of {@link bindPattern}, collecting bound names in binding order. The walks MUST stay structurally identical — slots are positional. */
const collectPatternNames = (pattern: acorn.AnyNode, out: string[]): void => {
	switch (pattern.type) {
		case "Identifier":
			out.push(pattern.name);
			return;
		case "AssignmentPattern":
			collectPatternNames(pattern.left, out);
			return;
		case "ObjectPattern":
			for (const prop of pattern.properties) {
				collectPatternNames(prop.type === "RestElement" ? prop.argument : prop.value, out);
			}
			return;
		case "ArrayPattern":
			for (const element of pattern.elements) {
				if (!element) continue;
				collectPatternNames(element.type === "RestElement" ? element.argument : element, out);
			}
			return;
		case "RestElement":
			collectPatternNames(pattern.argument, out);
			return;
		default:
			throw new ExpressionError(`"${pattern.type}" is not allowed in a parameter list`);
	}
};

/** Compile an identifier to a direct slot read, or a context lookup if free. */
const compileIdentifier = (name: string, scopes: readonly (readonly string[])[]): Thunk => {
	for (let depth = 0; depth < scopes.length; depth++) {
		const names = scopes[scopes.length - 1 - depth];
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

/** Evaluate a list left to right, flattening spreads. */
const listEvaluator = (
	parts: { thunk: Thunk; spread: boolean }[],
): ((frame: Frame | null, rt: Runtime) => unknown[]) => {
	return (frame, rt) => {
		const out: unknown[] = [];
		for (let i = 0; i < parts.length; i++) {
			const part = parts[i];
			const value = part.thunk(frame, rt);
			if (part.spread) pushSpread(out, value, rt.budget);
			else out.push(value);
		}
		return out;
	};
};

type BinaryFn = (l: unknown, r: unknown, budget: Budget) => unknown;

/** `+` is the one polymorphic operator: string concatenation or numeric addition. */
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
	typeof: (v) => typeof v,
};

const bindPattern = (
	pattern: acorn.Pattern,
	value: unknown,
	frame: Frame,
	rt: Runtime,
): void => {
	switch (pattern.type) {
		case "Identifier":
			frame.values.push(value);
			return;
		case "AssignmentPattern":
			// The default is a compiled thunk stashed on the node by compileNode.
			// It runs against the in-flight frame, so it sees earlier parameters.
			bindPattern(
				pattern.left,
				value === undefined
					? (pattern as unknown as { __default: Thunk }).__default(frame, rt)
					: value,
				frame,
				rt,
			);
			return;
		case "ObjectPattern": {
			const taken: string[] = [];
			for (const prop of pattern.properties) {
				if (prop.type === "RestElement") {
					const rest: Record<string, unknown> = {};
					if (value && typeof value === "object") {
						for (const [k, v] of Object.entries(value as object)) {
							if (!taken.includes(k)) defineKey(rest, k, v);
						}
					}
					bindPattern(prop.argument, rest, frame, rt);
					continue;
				}
				const key =
					prop.computed || prop.key.type !== "Identifier"
						? String((prop.key as acorn.Literal).value)
						: prop.key.name;
				taken.push(key);
				bindPattern(prop.value as acorn.Pattern, getMember(value, key, rt.budget), frame, rt);
			}
			return;
		}
		case "ArrayPattern": {
			if (!Array.isArray(value) && typeof value !== "string") {
				throw new ExpressionError(
					"Only arrays and strings can be destructured positionally",
					"runtime",
				);
			}
			pattern.elements.forEach((element, i) => {
				if (!element) return;
				if (element.type === "RestElement") {
					bindPattern(element.argument, (value as unknown[]).slice(i), frame, rt);
					return;
				}
				bindPattern(element, (value as unknown[])[i], frame, rt);
			});
			return;
		}
		default:
			throw new ExpressionError(`"${pattern.type}" is not allowed in a parameter list`);
	}
};

export const compileAst = (ast: acorn.Expression): Thunk => {
	const body = compileNode(ast, []);
	// The whole expression's straight-line work, charged once. What a callback
	// body costs is charged again per invocation, where it belongs.
	const cost = nodeCount(ast);
	return (frame, rt) => {
		rt.budget.tick(cost);
		return body(frame, rt);
	};
};

const compileNode = (
	node: acorn.AnyNode,
	scopes: readonly (readonly string[])[],
): Thunk => {
	switch (node.type) {
		case "Literal": {
			const value = node.value;
			return () => value;
		}

		case "Identifier":
			return compileIdentifier(node.name, scopes);

		case "TemplateLiteral": {
			const quasis = node.quasis.map((q) => q.value.cooked ?? "");
			if (node.expressions.length === 0) {
				const only = quasis[0];
				return () => only;
			}
			const parts = node.expressions.map((e) => ({
				thunk: compileNode(e, scopes),
				spread: false,
			}));
			const evalParts = listEvaluator(parts);
			return (frame, rt) => {
				const values = evalParts(frame, rt);
				let out = quasis[0];
				for (let i = 0; i < values.length; i++) {
					// Plain JS stringification, including "null" and "undefined". A
					// friendlier blank would be a silent divergence in the most common
					// formatting path; the document writes `?? ""` for that.
					const piece = String(values[i]) + (quasis[i + 1] ?? "");
					rt.budget.growString(out.length + piece.length, piece.length);
					out += piece;
				}
				return out;
			};
		}

		case "ChainExpression": {
			const inner = compileNode(node.expression, scopes);
			return (frame, rt) => {
				const v = inner(frame, rt);
				return v === SHORT ? undefined : v;
			};
		}

		case "MemberExpression": {
			// Fused fast path: `a.b.c.…` with no computed or optional link anywhere
			// collapses into ONE closure walking a key array — member chains are the
			// most common expression shape by far.
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
					const root = compileIdentifier(base.name, scopes);
					if (keys.length === 1) {
						const key = keys[0];
						return (frame, rt) => getStaticMember(root(frame, rt), key, rt.budget);
					}
					return (frame, rt) => {
						let value = root(frame, rt);
						for (let i = 0; i < keys.length; i++) {
							value = getStaticMember(value, keys[i], rt.budget);
						}
						return value;
					};
				}
				const baseThunk = compileNode(base, scopes);
				return (frame, rt) => {
					let value = baseThunk(frame, rt);
					if (value === SHORT) return SHORT;
					for (let i = 0; i < keys.length; i++) {
						value = getStaticMember(value, keys[i], rt.budget);
					}
					return value;
				};
			}

			const object = compileNode(node.object, scopes);
			const optional = node.optional;

			if (!node.computed) {
				const key =
					node.property.type === "Identifier"
						? node.property.name
						: String((node.property as acorn.Literal).value);
				return (frame, rt) => {
					const o = object(frame, rt);
					if (o === SHORT) return SHORT;
					if (optional && (o === null || o === undefined)) return SHORT;
					return getStaticMember(o, key, rt.budget);
				};
			}

			const property = compileNode(node.property, scopes);
			return (frame, rt) => {
				const o = object(frame, rt);
				if (o === SHORT) return SHORT;
				if (optional && (o === null || o === undefined)) return SHORT;
				return getMember(o, property(frame, rt), rt.budget);
			};
		}

		case "CallExpression": {
			const parts = node.arguments.map((arg) =>
				arg.type === "SpreadElement"
					? { thunk: compileNode(arg.argument, scopes), spread: true }
					: { thunk: compileNode(arg, scopes), spread: false },
			);
			const evalArgs = listEvaluator(parts);
			const optional = node.optional;

			// A method call: the receiver and the key stay together, so no method is
			// ever produced as a standalone value that could be re-bound.
			if (node.callee.type === "MemberExpression") {
				const callee = node.callee;
				const object = compileNode(callee.object, scopes);
				const keyThunk = callee.computed ? compileNode(callee.property, scopes) : null;
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

			const callee = compileNode(node.callee as acorn.Expression, scopes);
			const calleeName = node.callee.type === "Identifier" ? node.callee.name : null;
			return (frame, rt) => {
				const f = callee(frame, rt);
				if (f === SHORT) return SHORT;
				if (optional && (f === null || f === undefined)) return SHORT;
				const args = evalArgs(frame, rt);
				if (f instanceof Lambda) return f.call(args[0], args[1], args[2], args[3]);
				if (f instanceof HostFn) return f.fn(args[0]);
				if (f instanceof Namespace) {
					const builtin = CALLABLE_GLOBALS[f.name];
					if (builtin) return builtin(args, rt.budget);
					throw new ExpressionError(`"${f.name}" is not callable`, "runtime");
				}
				throw new ExpressionError(
					calleeName ? `"${calleeName}" is not a function` : "This expression is not callable",
					"runtime",
				);
			};
		}

		case "NewExpression": {
			const callee = compileNode(node.callee as acorn.Expression, scopes);
			const parts = node.arguments.map((arg) =>
				arg.type === "SpreadElement"
					? { thunk: compileNode(arg.argument, scopes), spread: true }
					: { thunk: compileNode(arg, scopes), spread: false },
			);
			const evalArgs = listEvaluator(parts);
			return (frame, rt) => construct(callee(frame, rt), evalArgs(frame, rt), rt.budget);
		}

		case "UnaryExpression": {
			const argument = compileNode(node.argument, scopes);
			const fn = UNARY_FNS[node.operator];
			if (!fn) throw new ExpressionError(`The "${node.operator}" operator is not allowed`);
			return (frame, rt) => fn(argument(frame, rt));
		}

		case "BinaryExpression": {
			const left = compileNode(node.left as acorn.Expression, scopes);
			const right = compileNode(node.right, scopes);
			const fn = BINARY_FNS[node.operator];
			if (!fn) throw new ExpressionError(`The "${node.operator}" operator is not allowed`);
			return (frame, rt) => fn(left(frame, rt), right(frame, rt), rt.budget);
		}

		case "LogicalExpression": {
			const left = compileNode(node.left, scopes);
			const right = compileNode(node.right, scopes);
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
			const test = compileNode(node.test, scopes);
			const consequent = compileNode(node.consequent, scopes);
			const alternate = compileNode(node.alternate, scopes);
			return (frame, rt) => (test(frame, rt) ? consequent(frame, rt) : alternate(frame, rt));
		}

		case "ArrayExpression": {
			const parts = node.elements.map((element) => {
				if (!element) return { thunk: (() => undefined) as Thunk, spread: false };
				return element.type === "SpreadElement"
					? { thunk: compileNode(element.argument, scopes), spread: true }
					: { thunk: compileNode(element, scopes), spread: false };
			});
			const evalParts = listEvaluator(parts);
			return (frame, rt) => {
				const values = evalParts(frame, rt);
				rt.budget.array(values.length);
				return values;
			};
		}

		case "ObjectExpression": {
			type Entry =
				| { spread: true; value: Thunk }
				| { spread: false; key: Thunk | string; value: Thunk };
			const entries: Entry[] = node.properties.map((prop) => {
				if (prop.type === "SpreadElement") {
					return { spread: true, value: compileNode(prop.argument, scopes) };
				}
				const key = prop.computed
					? compileNode(prop.key as acorn.Expression, scopes)
					: prop.key.type === "Identifier"
						? prop.key.name
						: String((prop.key as acorn.Literal).value);
				return {
					spread: false,
					key,
					value: compileNode(prop.value as acorn.Expression, scopes),
				};
			});

			return (frame, rt) => {
				const out: Record<string, unknown> = {};
				for (let i = 0; i < entries.length; i++) {
					const entry = entries[i];
					if (entry.spread) {
						spreadInto(out, entry.value(frame, rt), rt.budget);
						continue;
					}
					// A compile-time string key already passed the validator's
					// forbidden-name check, so plain assignment is safe — and an
					// order of magnitude cheaper than defineProperty.
					if (typeof entry.key === "string") {
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
			// The names this arrow binds, in binding order — the compile-time scope
			// the body and the parameter defaults resolve against.
			const boundNames: string[] = [];
			for (const param of params) collectPatternNames(param, boundNames);
			const inner = [...scopes, boundNames];

			// Every default in the parameter list gets a compiled thunk hung off its
			// node for bindPattern to read — at any depth, not just the top level.
			// Compiled in the INNER scope, so a default can read an earlier parameter.
			const attachDefaults = (pattern: acorn.AnyNode): void => {
				if (pattern.type === "AssignmentPattern") {
					(pattern as unknown as { __default: Thunk }).__default = compileNode(
						pattern.right,
						inner,
					);
					attachDefaults(pattern.left);
					return;
				}
				if (pattern.type === "ObjectPattern") {
					for (const prop of pattern.properties) {
						attachDefaults(prop.type === "RestElement" ? prop.argument : prop.value);
					}
					return;
				}
				if (pattern.type === "ArrayPattern") {
					for (const element of pattern.elements) if (element) attachDefaults(element);
					return;
				}
				if (pattern.type === "RestElement") attachDefaults(pattern.argument);
			};
			for (const param of params) attachDefaults(param);

			const body = compileNode(node.body as acorn.Expression, inner);
			// What one invocation costs: the whole arrow, parameters included, since
			// destructuring reads are membrane reads too. Charged once per call.
			const cost = nodeCount(node);

			// The overwhelmingly common shape — every parameter a plain name — skips
			// pattern binding entirely.
			if (params.every((p) => p.type === "Identifier")) {
				switch (params.length) {
					case 0:
						return (frame, rt) =>
							new Lambda(() => {
								const budget = rt.budget;
								budget.tick(cost);
								budget.enter();
								const out = body({ values: [], parent: frame }, rt);
								budget.depth--;
								return out;
							});
					case 1:
						return (frame, rt) =>
							new Lambda((a) => {
								const budget = rt.budget;
								budget.tick(cost);
								budget.enter();
								const out = body({ values: [a], parent: frame }, rt);
								budget.depth--;
								return out;
							});
					case 2:
						return (frame, rt) =>
							new Lambda((a, b) => {
								const budget = rt.budget;
								budget.tick(cost);
								budget.enter();
								const out = body({ values: [a, b], parent: frame }, rt);
								budget.depth--;
								return out;
							});
					default: {
						const arity = params.length;
						return (frame, rt) =>
							new Lambda((a, b, c, d) => {
								const budget = rt.budget;
								budget.tick(cost);
								budget.enter();
								const values = [a, b, c, d];
								values.length = arity;
								const out = body({ values, parent: frame }, rt);
								budget.depth--;
								return out;
							});
					}
				}
			}

			return (frame, rt) =>
				new Lambda((a, b, c, d) => {
					const budget = rt.budget;
					budget.tick(cost);
					budget.enter();
					const inFlight: Frame = { values: [], parent: frame };
					const args = [a, b, c, d];
					for (let i = 0; i < params.length; i++) {
						bindPattern(params[i], args[i], inFlight, rt);
					}
					const out = body(inFlight, rt);
					budget.depth--;
					return out;
				});
		}

		default:
			throw new ExpressionError(`"${node.type}" is not part of the expression language`);
	}
};
