import type * as acorn from "acorn";

// Low-level acorn-AST helpers shared by validate.ts and analyze.ts. NOT a parser
// — acorn parses; these are a node type-guard and a child-traversal helper.

/** Runtime guard: does `x` look like an AST node (object with a string `type`)? */
export function isNode(x: unknown): x is acorn.AnyNode {
  return (
    typeof x === "object" &&
    x !== null &&
    typeof (x as { type?: unknown }).type === "string"
  );
}

// Direct child nodes, flattening array-valued fields — for key-agnostic walks.
export function childNodes(node: acorn.AnyNode): acorn.AnyNode[] {
  const out: acorn.AnyNode[] = [];
  for (const value of Object.values(
    node as unknown as Record<string, unknown>,
  )) {
    if (Array.isArray(value)) {
      for (const child of value) if (isNode(child)) out.push(child);
    } else if (isNode(value)) {
      out.push(value);
    }
  }
  return out;
}
