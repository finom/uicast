import type * as acorn from "acorn";
import { ExpressionError } from "./errors";
import { ALLOWED_METHOD_NAMES, NAMESPACE_METHOD_NAMES } from "./membrane";
import {
	ALLOWED_BINARY,
	ALLOWED_LOGICAL,
	ALLOWED_NODES,
	ALLOWED_UNARY,
	FORBIDDEN_KEYS,
} from "./grammar";

// The structural pass: every node must be on the allow-list, plus the handful
// of shapes the list alone cannot express. The list is closed — anything
// unlisted is rejected whether or not anyone thought about it.

/** Deepest AST the compiler will walk — a nested expression cannot blow its stack. */
const MAX_DEPTH = 100;

const isNode = (value: unknown): value is acorn.AnyNode =>
	typeof value === "object" && value !== null && typeof (value as acorn.AnyNode).type === "string";

const childNodes = function* (node: acorn.AnyNode): Generator<acorn.AnyNode> {
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

export const validateNode = (node: acorn.AnyNode, depth = 0): void => {
	if (depth > MAX_DEPTH) {
		throw new ExpressionError(`Expression nests deeper than ${MAX_DEPTH} levels`);
	}

	if (!ALLOWED_NODES.has(node.type)) {
		throw new ExpressionError(`"${node.type}" is not part of the expression language`);
	}

	switch (node.type) {
		case "Literal":
			// A regex literal parses as a Literal carrying `regex`. Catastrophic
			// backtracking runs inside the regex engine, where the step budget
			// cannot reach it, so the language has no regular expressions at all.
			if ("regex" in node && node.regex) {
				throw new ExpressionError("Regular expressions are not available in expressions");
			}
			break;

		case "UnaryExpression":
			if (!ALLOWED_UNARY.has(node.operator)) {
				throw new ExpressionError(`The "${node.operator}" operator is not allowed`);
			}
			break;

		case "BinaryExpression":
			if (!ALLOWED_BINARY.has(node.operator)) {
				throw new ExpressionError(`The "${node.operator}" operator is not allowed`);
			}
			break;

		case "LogicalExpression":
			if (!ALLOWED_LOGICAL.has(node.operator)) {
				throw new ExpressionError(`The "${node.operator}" operator is not allowed`);
			}
			break;

		case "MemberExpression": {
			// Every statically-known key: dotted names and string-literal computed
			// keys. Only a run-time-assembled key escapes — the membrane catches it
			// in interpret; native documents it as its residual.
			const staticKey = !node.computed
				? node.property.type === "Identifier"
					? node.property.name
					: null
				: node.property.type === "Literal" && typeof node.property.value === "string"
					? node.property.value
					: null;
			if (staticKey !== null && FORBIDDEN_KEYS.has(staticKey)) {
				throw new ExpressionError(`Access to "${staticKey}" is not allowed`);
			}
			break;
		}

		case "ArrowFunctionExpression":
			// No block body: with it go every statement, every declaration, and
			// with those the last way to write a loop or a self-reference.
			if (node.body.type === "BlockStatement") {
				throw new ExpressionError(
					"A function body must be a single expression — statements are not available. " +
						"Use a ternary, or move the work into a host function",
				);
			}
			if (node.async) {
				throw new ExpressionError("An inline function cannot be async");
			}
			if (node.generator) {
				throw new ExpressionError("Generator functions are not available");
			}
			break;

		case "Property":
			if (node.kind !== "init") {
				throw new ExpressionError("Getters and setters are not allowed in an object literal");
			}
			if (node.method) {
				throw new ExpressionError("Method shorthand is not allowed in an object literal");
			}
			{
				const key = !node.computed
					? node.key.type === "Identifier"
						? node.key.name
						: node.key.type === "Literal" && typeof node.key.value === "string"
							? node.key.value
							: null
					: node.key.type === "Literal" && typeof node.key.value === "string"
						? node.key.value
						: null;
				if (key !== null && FORBIDDEN_KEYS.has(key)) {
					throw new ExpressionError(`An object literal cannot define "${key}"`);
				}
			}
			break;

		case "CallExpression":
		case "NewExpression": {
			// An immediately-invoked function is the only way left to sequence
			// work, and a ternary expresses everything it could.
			const callee = node.callee;
			if (callee.type === "ArrowFunctionExpression") {
				throw new ExpressionError(
					"Immediately-invoked functions are not allowed — use a ternary",
				);
			}
			// `a.b?.()` asks whether the METHOD is null, and methods are not
			// values here — `a?.b()` (is the receiver null) expresses the intent.
			if (node.type === "CallExpression" && node.optional) {
				throw new ExpressionError(
					'An optional call ("?.()") is not allowed — make the receiver optional instead: a?.b()',
				);
			}
			// A written method name is part of the shared grammar — both back
			// ends must refuse the same calls, so the check cannot live only in
			// the interpreter's tables.
			if (node.type === "CallExpression" && callee.type === "MemberExpression") {
				const name = !callee.computed
					? callee.property.type === "Identifier"
						? callee.property.name
						: null
					: callee.property.type === "Literal" && typeof callee.property.value === "string"
						? callee.property.value
						: null;
				const table =
					callee.object.type === "Identifier"
						? NAMESPACE_METHOD_NAMES[callee.object.name]
						: undefined;
				if (name !== null && !(table ?? ALLOWED_METHOD_NAMES).has(name)) {
					throw new ExpressionError(
						table
							? `"${(callee.object as acorn.Identifier).name}.${name}()" is not available`
							: `".${name}()" is not an available method`,
					);
				}
			}
			break;
		}

		case "Identifier":
			if (node.name === "eval" || node.name === "arguments") {
				throw new ExpressionError(`Access to "${node.name}" is not allowed`);
			}
			break;
	}

	for (const child of childNodes(node)) {
		// A non-computed member's `.property` is a name already checked above.
		if (node.type === "MemberExpression" && !node.computed && child === node.property) continue;
		if (node.type === "Property" && !node.computed && child === node.key) continue;
		validateNode(child, depth + 1);
	}
};
