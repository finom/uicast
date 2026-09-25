import type * as acorn from "acorn";

const isNode = (value: unknown): value is acorn.AnyNode =>
	typeof value === "object" && value !== null && typeof (value as acorn.AnyNode).type === "string";

export const childNodes = function* (node: acorn.AnyNode): Generator<acorn.AnyNode> {
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

// Binding order: the compiler's slots are positional.
export const patternNames = (pattern: acorn.AnyNode | null, out: string[]): void => {
	if (!pattern) return;
	switch (pattern.type) {
		case "Identifier":
			out.push(pattern.name);
			return;
		case "AssignmentPattern":
			patternNames(pattern.left, out);
			return;
		case "RestElement":
			patternNames(pattern.argument, out);
			return;
		case "ObjectPattern":
			for (const p of pattern.properties) patternNames(p.type === "RestElement" ? p.argument : p.value, out);
			return;
		case "ArrayPattern":
			for (const el of pattern.elements) patternNames(el, out);
			return;
	}
};

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
		const { callee } = node;
		walkMemberReads(callee.type === "MemberExpression" && !callee.computed ? callee.object : callee, root, out);
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

// The static paths under `root` an expression reads: `scopes.a.b`.
export const memberReads = (ast: acorn.AnyNode, root: string): string[] => {
	const out = new Set<string>();
	walkMemberReads(ast, root, out);
	return [...out];
};

// `inCallback`: the name sits inside an arrow, its parameters included, so it runs once per call of that arrow.
type FreeVisitor = (name: string, node: acorn.Identifier, parent: acorn.AnyNode | null, inCallback: boolean) => void;

// An arrow's parameter list is the only binder, so the scope is a stack of parameter sets.
const walkFree = (node: acorn.AnyNode, parent: acorn.AnyNode | null, bound: Set<string>[], visit: FreeVisitor): void => {
	switch (node.type) {
		case "Identifier":
			if (!bound.some((names) => names.has(node.name))) visit(node.name, node, parent, bound.length > 0);
			return;
		case "MemberExpression":
			walkFree(node.object, node, bound, visit);
			if (node.computed) walkFree(node.property, node, bound, visit);
			return;
		case "Property":
			if (node.computed) walkFree(node.key, node, bound, visit);
			walkFree(node.value, node, bound, visit);
			return;
		case "ArrowFunctionExpression": {
			const names: string[] = [];
			for (const p of node.params) patternNames(p, names);
			const inner = [...bound, new Set(names)];
			// A parameter default can read outer names and earlier parameters.
			for (const p of node.params) walkFree(p, node, inner, visit);
			walkFree(node.body, node, inner, visit);
			return;
		}
	}
	for (const child of childNodes(node)) walkFree(child, node, bound, visit);
};

export const walkFreeIdentifiers = (ast: acorn.AnyNode, visit: FreeVisitor): void => walkFree(ast, null, [], visit);

export const freeIdentifiers = (ast: acorn.AnyNode): string[] => {
	const out = new Set<string>();
	walkFreeIdentifiers(ast, (name) => out.add(name));
	return [...out];
};
