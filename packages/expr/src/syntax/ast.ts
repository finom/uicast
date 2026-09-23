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
