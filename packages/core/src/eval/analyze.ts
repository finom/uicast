import type * as acorn from "acorn";
import { childNodes } from "./ast";

/**
 * Static analysis of a parsed expression — this is NOT the security boundary
 * (that's `SafeEval.ts`). Two outputs feed the renderer:
 *
 * - `containsAwait` → whether to compile the expression as an `AsyncFunction`.
 * - `extractScopeReads` → the reactive subscription set for a chunk (which
 *   `scopes.X.Y` paths the expression reads), so the LLM never hand-writes a
 *   `deps` array.
 */

/** Check whether the AST contains any AwaitExpression node. */
export function containsAwait(node: acorn.AnyNode | null | undefined): boolean {
  if (!node || typeof node !== "object") return false;
  if (node.type === "AwaitExpression") return true;
  for (const child of childNodes(node)) {
    if (containsAwait(child)) return true;
  }
  return false;
}

// --- Scope-read extraction ---
//
// Walks the AST collecting every `scopes.X.Y…` chain the expression reads,
// stopping at the first non-static segment (computed-key, call, non-Identifier
// property). The output drives the reactive subscription set for a chunk —
// the LLM no longer specifies `deps` manually; it's auto-derived here.
//
// Chains that appear as the callee of a CallExpression are recorded WITHOUT
// the final segment — `scopes.inv.rows.filter(...)` yields `scopes.inv.rows`,
// not `scopes.inv.rows.filter`. The trailing identifier is a method call, not
// a data dependency. Edge cases:
//   - `scopes.x[scopes.y.z]`        → adds `scopes.x` AND `scopes.y.z`
//   - `scopes.x[i].y`               → adds `scopes.x` (mid-chain dynamic; `.y`
//                                     is unreachable without resolving `i`)
//   - `scopes` alone                → nothing (bare identifier, no path)
//   - `({a: scopes.x.y, b: scopes.x.z})` → adds both
//   - `\`${scopes.x.y}\``           → adds `scopes.x.y` (template literal walked)

/**
 * Walk down a MemberExpression chain collecting static identifier segments.
 * Returns null if the chain hits a computed-key access or a non-Identifier
 * property anywhere along the way.
 */
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

/**
 * Walk the children of a MemberExpression looking for computed-key
 * sub-expressions. Each computed key may itself contain `scopes.X.Y` reads
 * we need to capture.
 */
function walkComputedKeysWithin(memberExpr: acorn.AnyNode, out: Set<string>): void {
  let cur: acorn.AnyNode = memberExpr;
  while (cur.type === "MemberExpression") {
    if (cur.computed) {
      walkScopeReads(cur.property, out);
    }
    cur = cur.object;
  }
}

/**
 * Recursive AST walker. Public entry point is `extractScopeReads(ast)`.
 */
function walkScopeReads(
  node: acorn.AnyNode | null | undefined,
  out: Set<string>,
): void {
  if (!node || typeof node !== "object") return;

  // CallExpression: if callee is a MemberExpression like `scopes.X.Y.method`,
  // record `scopes.X.Y` (drop the method name). The trailing segment is a
  // method dispatch, not a data read.
  if (node.type === "CallExpression") {
    const callee = node.callee;
    if (callee.type === "MemberExpression" && !callee.computed) {
      const chain = collectChain(callee.object);
      if (chain && chain[0] === "scopes" && chain.length > 1) {
        out.add(chain.join("."));
        // The callee's object may itself contain computed sub-keys we missed.
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

  // MemberExpression: try to collect a static chain rooted at `scopes`.
  if (node.type === "MemberExpression") {
    const chain = collectChain(node);
    if (chain && chain[0] === "scopes" && chain.length > 1) {
      out.add(chain.join("."));
      walkComputedKeysWithin(node, out);
      return;
    }
    // Chain didn't reach `scopes` (or hit a computed segment). Walk children
    // so we catch nested `scopes.X.Y` reads inside computed keys / object refs.
    walkScopeReads(node.object, out);
    if (node.computed) {
      walkScopeReads(node.property, out);
    }
    return;
  }

  // Generic recursion for everything else (ArrowFunction body, Object/Array
  // literals, conditional/logical expressions, template literals, etc.).
  for (const child of childNodes(node)) {
    walkScopeReads(child, out);
  }
}

export function extractScopeReads(ast: acorn.AnyNode): string[] {
  const out = new Set<string>();
  walkScopeReads(ast, out);
  return [...out];
}
