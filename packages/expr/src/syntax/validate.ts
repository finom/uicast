import type * as acorn from "acorn";
import { ALLOWED_GLOBALS, CALLABLE_GLOBALS, CONSTRUCTIBLE_GLOBALS } from "../constants/globals";
import { ALLOWED_BINARY, ALLOWED_LOGICAL, ALLOWED_NODES, ALLOWED_UNARY } from "../constants/grammar";
import { MAX_ARROW_PARAMS, MAX_AST_DEPTH } from "../constants/limits";
import { ALLOWED_METHOD_NAMES, CALLBACK_ARGUMENT, LOCALE_METHOD_ARITY, localeArgumentsMessage, NAMESPACE_METHOD_NAMES } from "../constants/methods";
import { ExpressionError } from "../errors";
import { walkFreeIdentifiers } from "./analyze";
import { childNodes } from "./ast";

const OPERATORS: Record<string, ReadonlySet<string>> = {
	UnaryExpression: ALLOWED_UNARY,
	BinaryExpression: ALLOWED_BINARY,
	LogicalExpression: ALLOWED_LOGICAL,
};

// A property name the source spells out: `a.b`, `a["b"]`, a[`b`], `{ b: 1 }`, `{ "b": 1 }`.
export const writtenName = (key: acorn.AnyNode, computed: boolean): string | null => {
	if (!computed && key.type === "Identifier") return key.name;
	if (key.type === "Literal" && typeof key.value === "string") return key.value;
	if (key.type === "TemplateLiteral" && key.expressions.length === 0) {
		return key.quasis[0].value.cooked ?? null;
	}
	return null;
};

const CALLBACK_METHODS = Object.entries(CALLBACK_ARGUMENT)
	.map(([name, index]) => (index === 0 ? name : `${name} (second argument)`))
	.join(", ");

// The argument of this call written where a callback goes, if any.
const callbackArgument = (node: acorn.CallExpression): acorn.AnyNode | undefined => {
	if (node.callee.type !== "MemberExpression") return undefined;
	const name = writtenName(node.callee.property, node.callee.computed);
	const index = name === null ? undefined : CALLBACK_ARGUMENT[name];
	return index === undefined ? undefined : node.arguments[index];
};

export const validateNode = (node: acorn.AnyNode, depth = 0, isCallback = false): void => {
	if (depth > MAX_AST_DEPTH) throw new ExpressionError(`Expression nests deeper than ${MAX_AST_DEPTH} levels`);
	if (!ALLOWED_NODES.has(node.type)) {
		throw new ExpressionError(`"${node.type}" is not part of the expression language`);
	}

	switch (node.type) {
		case "Literal":
			// Backtracking runs inside the regex engine, out of the step budget's reach; a BigInt operation can run for seconds with nothing to charge.
			if (node.regex) {
				throw new ExpressionError("Regular expressions are not available in expressions");
			}
			if (typeof node.value === "bigint") {
				throw new ExpressionError("BigInt literals are not available in expressions");
			}
			break;

		// JS leaves a hole there, which array methods skip; nothing here would.
		case "ArrayExpression":
			if (node.elements.includes(null)) {
				throw new ExpressionError("An array literal cannot skip an item — write undefined there");
			}
			break;

		case "UnaryExpression":
		case "BinaryExpression":
		case "LogicalExpression":
			if (!OPERATORS[node.type].has(node.operator)) {
				throw new ExpressionError(`The "${node.operator}" operator is not allowed`);
			}
			break;

		case "ArrowFunctionExpression":
			if (!isCallback) {
				throw new ExpressionError(
					`A function can only be written as a method's callback, as in rows.map(r => r.name). Methods that take one: ${CALLBACK_METHODS}`,
				);
			}
			// No block body: with it go every statement, every declaration, and the last way to write a loop or a self-reference.
			if (node.body.type === "BlockStatement") {
				throw new ExpressionError(
					"A function body must be a single expression — statements are not available. " +
						"Use a ternary, or move the work into a host function",
				);
			}
			if (node.async) throw new ExpressionError("An inline function cannot be async");
			if (node.params.length > MAX_ARROW_PARAMS) {
				throw new ExpressionError(`A function can take at most ${MAX_ARROW_PARAMS} parameters`);
			}
			if (node.params.some((p) => p.type === "RestElement")) {
				throw new ExpressionError("Rest parameters (...args) are not available");
			}
			break;

		case "Property": {
			if (node.kind !== "init") throw new ExpressionError("Getters and setters are not allowed in an object literal");
			if (node.method) throw new ExpressionError("Method shorthand is not allowed in an object literal");
			// `{ __proto__: x }` is JS syntax for setting the prototype — a form the language does not have.
			// A computed key defines an own property, as in JS.
			if (!node.computed && writtenName(node.key, false) === "__proto__") {
				throw new ExpressionError('An object literal cannot set "__proto__"');
			}
			break;
		}

		case "CallExpression": {
			const callee = node.callee;
			// `a.b?.()` asks whether the METHOD is null, and methods are not values here — `a?.b()` expresses the intent.
			if (node.optional) {
				throw new ExpressionError(
					'An optional call ("?.()") is not allowed — make the receiver optional instead: a?.b()',
				);
			}
			// Written method names are grammar, not interpreter tables — both back ends must refuse the same calls.
			if (callee.type === "MemberExpression") {
				const name = writtenName(callee.property, callee.computed);
				const table = callee.object.type === "Identifier" ? NAMESPACE_METHOD_NAMES[callee.object.name] : undefined;
				if (name !== null && !(table ?? ALLOWED_METHOD_NAMES).has(name)) {
					throw new ExpressionError(
						table
							? `"${(callee.object as acorn.Identifier).name}.${name}()" is not available`
							: `".${name}()" is not an available method`,
					);
				}
				const arity = name === null ? undefined : LOCALE_METHOD_ARITY[name];
				if (name !== null && arity !== undefined) {
					if (node.arguments.length > arity || node.arguments.some((arg) => arg.type === "SpreadElement")) {
						throw new ExpressionError(localeArgumentsMessage(name));
					}
				}
			}
			break;
		}
	}

	const callback = node.type === "CallExpression" ? callbackArgument(node) : undefined;
	for (const child of childNodes(node)) {
		// A non-computed member property or object key is a name, not an expression.
		if (node.type === "MemberExpression" && !node.computed && child === node.property) continue;
		if (node.type === "Property" && !node.computed && child === node.key) continue;
		validateNode(child, depth + 1, child === callback);
	}
};

// Where a value becomes the expression's result: the root, a branch of `?:`, the right side of `&&`, `||`, `??`.
const resultPositions = (node: acorn.AnyNode, out: Set<acorn.AnyNode>): Set<acorn.AnyNode> => {
	out.add(node);
	if (node.type === "ConditionalExpression") {
		resultPositions(node.consequent, out);
		resultPositions(node.alternate, out);
	} else if (node.type === "LogicalExpression") {
		resultPositions(node.right, out);
	}
	return out;
};

// A host function may only be the callee of a call with 0 or 1 non-spread argument, standing where its value is the result,
// never a value; a global is callable or constructible only where the tables say. Returns the free identifiers.
export const validateFreeIdentifiers = (ast: acorn.Expression, isTool: (name: string) => boolean): string[] => {
	const out = new Set<string>();
	let results: Set<acorn.AnyNode> | null = null;
	walkFreeIdentifiers(ast, (name, node, parent, inCallback) => {
		out.add(name);
		// `foo(double)` also gives `double` a CallExpression parent — only the identity check tells callee from argument.
		const callee = parent !== null && parent.type === "CallExpression" && parent.callee === node;
		if (isTool(name)) {
			if (!callee) {
				throw new ExpressionError(
					`"${name}" is a host function — it can only be called, as ${name}(...), not used as a value`,
				);
			}
			const args = parent.arguments;
			if (args.length > 1) {
				throw new ExpressionError(
					`"${name}" takes a single argument — call it as ${name}({ ... }), or ${name}() when it takes no input`,
				);
			}
			if (args.length === 1 && args[0].type === "SpreadElement") {
				throw new ExpressionError(`"${name}" cannot be called with a spread argument`);
			}
			// Refused before anything runs: elsewhere the call would start its effect, and nothing would await it.
			if (inCallback) {
				throw new ExpressionError(
					`"${name}" is a host function — it cannot be called inside a callback. ` +
						"Call one function that returns everything, as getOrders({ ids }) rather than ids.map(id => getOrder({ id }))",
				);
			}
			results ??= resultPositions(ast, new Set());
			if (!results.has(parent)) {
				throw new ExpressionError(
					`"${name}" is a host function — its call must be the result itself, not part of one: ` +
						`the whole expression, a branch of ?:, or the right side of ??, || or &&, as in cached ?? ${name}()`,
				);
			}
			return;
		}
		if (!ALLOWED_GLOBALS.includes(name)) return;
		if (callee && !CALLABLE_GLOBALS.has(name)) {
			throw new ExpressionError(
				CONSTRUCTIBLE_GLOBALS.has(name)
					? `"${name}" cannot be called — use new ${name}(...)`
					: `"${name}" cannot be called`,
			);
		}
		if (parent?.type === "NewExpression" && parent.callee === node && !CONSTRUCTIBLE_GLOBALS.has(name)) {
			throw new ExpressionError(`"new ${name}" is not available — only Date and Set`);
		}
	});
	return [...out];
};
