import type * as acorn from "acorn";

/**
 * Low-level AST helpers shared by the validator (`SafeEval.ts`) and the static
 * analyzers (`analyze.ts`).
 *
 * Node types come straight from acorn: `acorn.AnyNode` is the discriminated
 * union `parse()` produces (narrowing on `.type`). We don't hand-roll a node
 * type — acorn ships first-party types that match its own output exactly,
 * including the `start`/`end` offsets that `@types/estree` omits.
 */

/** Runtime guard: does `x` look like an AST node (object with a string `type`)? */
export function isNode(x: unknown): x is acorn.AnyNode {
  return (
    typeof x === "object" &&
    x !== null &&
    typeof (x as { type?: unknown }).type === "string"
  );
}

/**
 * Direct child nodes of `node`, flattening array-valued fields. For generic,
 * key-agnostic walks — the discriminated union has no index signature, so we
 * read the runtime shape (`Object.values`) and keep only the real nodes.
 */
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
