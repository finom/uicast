import type * as acorn from "acorn";
import { childNodes, patternNames } from "./ast";

// `a.b.c` → `["a","b","c"]`, or null at the first dynamic segment.
const collectChain = (node: acorn.AnyNode): string[] | null => {
	const parts: string[] = [];
	let cur: acorn.AnyNode = node;
	for (;;) {
		if (cur.type === "ChainExpression") {
			cur = cur.expression;
		} else if (cur.type === "MemberExpression") {
			if (cur.computed || cur.property.type !== "Identifier") return null;
			parts.unshift(cur.property.name);
			cur = cur.object;
		} else if (cur.type === "Identifier") {
			parts.unshift(cur.name);
			return parts;
		} else {
			return null;
		}
	}
};

const walkMemberReads = (node: acorn.AnyNode, root: string, out: Set<string>): void => {
	// A method call depends on the chain, not the method name: `rows.filter(…)` reads `rows`, not `rows.filter`.
	if (node.type === "CallExpression") {
		const callee = node.callee;
		if (callee.type === "MemberExpression" && !callee.computed) {
			const chain = collectChain(callee.object);
			if (chain && chain[0] === root && chain.length > 1) out.add(chain.join("."));
			else walkMemberReads(callee.object, root, out);
		} else {
			walkMemberReads(callee, root, out);
		}
		for (const arg of node.arguments) walkMemberReads(arg, root, out);
		return;
	}

	if (node.type === "MemberExpression") {
		const chain = collectChain(node);
		if (chain && chain[0] === root && chain.length > 1) {
			out.add(chain.join("."));
			return;
		}
		walkMemberReads(node.object, root, out);
		if (node.computed) walkMemberReads(node.property, root, out);
		return;
	}

	for (const child of childNodes(node)) walkMemberReads(child, root, out);
};

export const extractMemberReads = (ast: acorn.AnyNode, root: string): string[] => {
	const out = new Set<string>();
	walkMemberReads(ast, root, out);
	return [...out];
};

// An arrow's parameter list is the only binder, so the scope walk is short.
const isBound = (name: string, stack: Set<string>[]): boolean => {
	for (let i = stack.length - 1; i >= 0; i--) if (stack[i].has(name)) return true;
	return false;
};

// `inCallback`: the name sits inside an arrow, its parameters included, so it runs once per call of that arrow.
type FreeVisitor = (name: string, node: acorn.Identifier, parent: acorn.AnyNode | null, inCallback: boolean) => void;

const walkFree = (node: acorn.AnyNode, parent: acorn.AnyNode | null, stack: Set<string>[], visit: FreeVisitor): void => {
	switch (node.type) {
		case "Identifier":
			if (!isBound(node.name, stack)) visit(node.name, node, parent, stack.length > 0);
			return;
		case "MemberExpression":
			walkFree(node.object, node, stack, visit);
			if (node.computed) walkFree(node.property, node, stack, visit);
			return;
		case "Property":
			if (node.computed) walkFree(node.key, node, stack, visit);
			walkFree(node.value, node, stack, visit);
			return;
		case "ArrowFunctionExpression": {
			const names: string[] = [];
			for (const p of node.params) patternNames(p, names);
			const inner = [...stack, new Set(names)];
			// A parameter default can read outer names and earlier parameters.
			for (const p of node.params) walkFree(p, node, inner, visit);
			walkFree(node.body, node, inner, visit);
			return;
		}
	}

	for (const child of childNodes(node)) walkFree(child, node, stack, visit);
};

export const walkFreeIdentifiers = (ast: acorn.AnyNode, visit: FreeVisitor): void => {
	walkFree(ast, null, [], visit);
};
