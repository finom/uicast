import type * as acorn from "acorn";
import { childNodes } from "./ast-utils";

// Static analysis of a parsed expression (not the security check — that's
// validate.ts). Two things the renderer needs: whether the expr is async
// (containsAwait), and which scopes.X.Y paths it reads (extractScopeReads), so it
// can subscribe without the LLM writing a deps array.

/** Does the expression `await` anything? */
export function containsAwait(node: acorn.AnyNode | null | undefined): boolean {
  if (!node || typeof node !== "object") return false;
  if (node.type === "AwaitExpression") return true;
  for (const child of childNodes(node)) {
    if (containsAwait(child)) return true;
  }
  return false;
}

// Collect every static scopes.X.Y chain the expression reads, stopping at the
// first dynamic segment (computed key, call, non-identifier property). A method
// call drops its last segment (rows.filter(...) depends on rows, not .filter).
// The test file pins the trickier cases.

// Read a member chain into its identifier segments (`a.b.c` -> ["a","b","c"]), or
// null if it hits a computed / non-identifier segment.
function collectChain(node: acorn.AnyNode | null | undefined): string[] | null {
  const parts: string[] = [];
  let cur: acorn.AnyNode | null | undefined = node;
  while (cur) {
    if (cur.type === "MemberExpression") {
      if (cur.computed) return null;
      const prop = cur.property;
      if (prop.type !== "Identifier") return null;
      parts.unshift(prop.name);
      cur = cur.object;
    } else if (cur.type === "Identifier") {
      parts.unshift(cur.name);
      return parts;
    } else {
      return null;
    }
  }
  return null;
}

// A computed key can read scopes itself (`scopes.x[scopes.y]`), so walk the
// computed parts of a chain too.
function walkComputedKeysWithin(memberExpr: acorn.AnyNode, out: Set<string>): void {
  let cur: acorn.AnyNode = memberExpr;
  while (cur.type === "MemberExpression") {
    if (cur.computed) {
      walkScopeReads(cur.property, out);
    }
    cur = cur.object;
  }
}

// The recursive walker behind extractScopeReads().
function walkScopeReads(
  node: acorn.AnyNode | null | undefined,
  out: Set<string>,
): void {
  if (!node || typeof node !== "object") return;

  // A method call depends on the chain, not the method name — record the chain
  // without the method, then recurse args.
  if (node.type === "CallExpression") {
    const callee = node.callee;
    if (callee.type === "MemberExpression" && !callee.computed) {
      const chain = collectChain(callee.object);
      if (chain && chain[0] === "scopes" && chain.length > 1) {
        out.add(chain.join("."));
        walkComputedKeysWithin(callee.object, out);
      } else {
        walkScopeReads(callee.object, out);
      }
    } else {
      walkScopeReads(callee, out);
    }
    for (const arg of node.arguments) {
      walkScopeReads(arg, out);
    }
    return;
  }

  // A plain member read: take the chain if it's rooted at `scopes`.
  if (node.type === "MemberExpression") {
    const chain = collectChain(node);
    if (chain && chain[0] === "scopes" && chain.length > 1) {
      out.add(chain.join("."));
      walkComputedKeysWithin(node, out);
      return;
    }
    // Not a scopes chain (or it hit a computed segment) — recurse for nested reads.
    walkScopeReads(node.object, out);
    if (node.computed) {
      walkScopeReads(node.property, out);
    }
    return;
  }

  for (const child of childNodes(node)) {
    walkScopeReads(child, out);
  }
}

export function extractScopeReads(ast: acorn.AnyNode): string[] {
  const out = new Set<string>();
  walkScopeReads(ast, out);
  return [...out];
}
