import type * as acorn from "acorn";
import { ExpressionError } from "@uicast/expr";
import { childNodes, writtenName } from "@uicast/expr/internal";

// Every identifier in the source becomes a parameter, so nothing resolves to a global by accident: bound names get values, the rest are `undefined`.
// Written prototype names are refused up front — nothing checks a read at run time here.

// Can the engine take `name` as a strict-mode parameter? Asked once per name, no list.
const bindable = new Map<string, boolean>();
export const canBind = (name: string): boolean => {
	let ok = bindable.get(name);
	if (ok === undefined) {
		try {
			new Function(name, '"use strict";');
			ok = true;
		} catch {
			ok = false;
		}
		bindable.set(name, ok);
	}
	return ok;
};

// Every identifier name in the tree: references, parameters, keys and property names alike.
const identifierNames = (node: acorn.AnyNode, out: Set<string>): void => {
	if (node.type === "Identifier") out.add(node.name);
	for (const child of childNodes(node)) identifierNames(child, out);
};

// Written member names that reach the prototype chain or re-bind a receiver. The interpreter's membrane makes them unreachable; here they are refused before the source runs. A name assembled at run time is this package's documented residual.
const PROTOTYPE_NAMES: ReadonlySet<string> = new Set([
	"constructor", "__proto__", "prototype",
	"__defineGetter__", "__defineSetter__", "__lookupGetter__", "__lookupSetter__",
	"caller", "callee", "arguments", "bind", "call", "apply",
]);

const refusePrototypeNames = (node: acorn.AnyNode): void => {
	if (node.type === "MemberExpression") {
		const key = writtenName(node.property, node.computed);
		if (key !== null && PROTOTYPE_NAMES.has(key)) throw new ExpressionError(`Access to "${key}" is not allowed`);
	}
	for (const child of childNodes(node)) refusePrototypeNames(child);
};

export type Compiled = (...values: unknown[]) => unknown;

// `bindings` are the names the caller supplies, positionally. Every other name is a parameter too, never passed, so it reads as `undefined`.
export const compile = (source: string, ast: acorn.Expression, bindings: readonly string[]): Compiled => {
	refusePrototypeNames(ast);
	const names = new Set<string>();
	identifierNames(ast, names);
	// A keyword or `eval` cannot be a parameter — and cannot be a reference in strict code either, so skipping it loses nothing.
	const dead = [...names].filter((name) => !bindings.includes(name) && canBind(name));
	try {
		return new Function(...bindings, ...dead, `"use strict"; return (${source}\n);`) as Compiled;
	} catch (err) {
		throw new ExpressionError(
			`Failed to compile expression: ${err instanceof Error ? err.message : String(err)}. Expression: ${source}`,
			"expression-syntax",
			err,
		);
	}
};
