import type * as acorn from "acorn";
import { type EvaluatorContexts, ExpressionError } from "@uicast/expr";
import { type Analysis, childNodes, type HostFunction, writtenName } from "@uicast/expr/internal";
import { PLATFORM_GLOBALS } from "./platform-globals";

// Every identifier in the source becomes a parameter, so nothing resolves to a global by accident:
// bound names get values, the rest are `undefined`.
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

// Written member names that reach the prototype chain or re-bind a receiver. The interpreter's membrane makes
// them unreachable; here they are refused before the source runs. A name assembled at run time is the documented residual.
const PROTOTYPE_NAMES: ReadonlySet<string> = new Set([
	"constructor", "__proto__", "prototype",
	"__defineGetter__", "__defineSetter__", "__lookupGetter__", "__lookupSetter__",
	"caller", "callee", "arguments", "bind", "call", "apply",
]);

const refuse = (key: string | null): void => {
	if (key !== null && PROTOTYPE_NAMES.has(key)) throw new ExpressionError(`Access to "${key}" is not allowed`);
};

// Member reads and destructuring keys read a name; an object literal's key defines an own one.
const refusePrototypeNames = (node: acorn.AnyNode): void => {
	if (node.type === "MemberExpression") refuse(writtenName(node.property, node.computed));
	if (node.type === "ObjectPattern") {
		for (const prop of node.properties) {
			if (prop.type === "Property") refuse(writtenName(prop.key, prop.computed));
		}
	}
	for (const child of childNodes(node)) refusePrototypeNames(child);
};

// The contexts, last one first, then the platform globals.
const lookup = (name: string, contexts: EvaluatorContexts): unknown => {
	for (let i = contexts.length - 1; i >= 0; i--) {
		if (Object.hasOwn(contexts[i], name)) return contexts[i][name];
	}
	if (Object.hasOwn(PLATFORM_GLOBALS, name)) return PLATFORM_GLOBALS[name];
	throw new ExpressionError(`"${name}" is not available in expressions`, "unknown-reference");
};

export type Compiled = (contexts: EvaluatorContexts) => unknown;

// One engine-compiled function per source. `inner` takes every identifier the source writes as a parameter;
// the wrapper fills the bound ones — host functions, then each context id — in one fixed-arity call, so nothing is
// allocated per evaluation.
export const compile = ({ source, ast, freeIds, toolCalls }: Analysis<Compiled>, tools: Record<string, HostFunction>): Compiled => {
	refusePrototypeNames(ast);
	const names = new Set<string>();
	identifierNames(ast, names);
	// Free ids a context must supply.
	const contextIds = freeIds.filter((id) => !toolCalls.includes(id));
	const bound = [...toolCalls, ...contextIds];
	// A keyword or `eval` cannot be a parameter — and cannot be a reference in strict code either, so skipping it loses nothing.
	const dead = [...names].filter((name) => !bound.includes(name) && canBind(name));
	const args = [
		...toolCalls.map((_, i) => `tools[${i}]`),
		...contextIds.map((name) => `lookup(${JSON.stringify(name)}, contexts)`),
	];
	try {
		const factory = new Function(
			"tools",
			"lookup",
			`"use strict";
const inner = function (${[...bound, ...dead].join(", ")}) { return (${source}
); };
return function (contexts) { return inner(${args.join(", ")}); };`,
		);
		return factory(toolCalls.map((name) => tools[name]), lookup) as Compiled;
	} catch (err) {
		throw new ExpressionError(
			`Failed to compile expression: ${err instanceof Error ? err.message : String(err)}. Expression: ${source}`,
			"expression-syntax",
			err,
		);
	}
};
