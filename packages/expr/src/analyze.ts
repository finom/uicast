import type * as acorn from "acorn";

// Static facts a host needs about an expression: which `<root>.X.Y`
// member paths does it read (so subscriptions can be derived
// rather than hand-written), and which names does it take from outside.

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

/** `a.b.c` → `["a","b","c"]`, or null at the first dynamic segment. */
const collectChain = (node: acorn.AnyNode | null | undefined): string[] | null => {
	const parts: string[] = [];
	let cur: acorn.AnyNode | null | undefined = node;
	while (cur) {
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
	return null;
};

const walkMemberReads = (
	node: acorn.AnyNode | null | undefined,
	root: string,
	out: Set<string>,
): void => {
	if (!node || typeof node !== "object") return;

	// A method call depends on the chain, not the method name:
	// `rows.filter(…)` reads `rows`, not `rows.filter`.
	if (node.type === "CallExpression") {
		const callee = node.callee;
		if (callee.type === "MemberExpression" && !callee.computed) {
			const chain = collectChain(callee.object);
			if (chain && chain[0] === root && chain.length > 1) out.add(chain.join("."));
			else walkMemberReads(callee.object, root, out);
		} else {
			walkMemberReads(callee as acorn.AnyNode, root, out);
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

// Free identifiers — names taken from outside. The only binder in this language
// is an arrow's parameter list, so the scope walk is short.
const bindPattern = (node: acorn.AnyNode | null | undefined, scope: Set<string>): void => {
	if (!node) return;
	switch (node.type) {
		case "Identifier":
			scope.add(node.name);
			break;
		case "ObjectPattern":
			for (const p of node.properties) {
				bindPattern(p.type === "RestElement" ? p.argument : p.value, scope);
			}
			break;
		case "ArrayPattern":
			for (const el of node.elements) if (el) bindPattern(el, scope);
			break;
		case "AssignmentPattern":
			bindPattern(node.left, scope);
			break;
		case "RestElement":
			bindPattern(node.argument, scope);
			break;
	}
};

const isBound = (name: string, stack: Set<string>[]): boolean => {
	for (let i = stack.length - 1; i >= 0; i--) if (stack[i].has(name)) return true;
	return false;
};

/** Called for each free identifier, with the node that contains it. */
export type FreeVisitor = (
	name: string,
	node: acorn.Identifier,
	parent: acorn.AnyNode | null,
) => void;

const walkFree = (
	node: acorn.AnyNode | null | undefined,
	parent: acorn.AnyNode | null,
	stack: Set<string>[],
	visit: FreeVisitor,
): void => {
	if (!node || typeof node !== "object") return;

	switch (node.type) {
		case "Identifier":
			if (!isBound(node.name, stack)) visit(node.name, node, parent);
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
			const scope = new Set<string>();
			for (const p of node.params) bindPattern(p, scope);
			const inner = [...stack, scope];
			// Default values in the params can reference outer names.
			for (const p of node.params) walkFree(p, node, inner, visit);
			walkFree(node.body as acorn.AnyNode, node, inner, visit);
			return;
		}
	}

	for (const child of childNodes(node)) walkFree(child, node, stack, visit);
};

/** Every identifier no enclosing arrow binds. Arrow parameters are the only binder. */
export const walkFreeIdentifiers = (ast: acorn.AnyNode, visit: FreeVisitor): void => {
	walkFree(ast, null, [new Set()], visit);
};

export const extractFreeIdentifiers = (ast: acorn.AnyNode): string[] => {
	const out = new Set<string>();
	walkFreeIdentifiers(ast, (name) => out.add(name));
	return [...out];
};
