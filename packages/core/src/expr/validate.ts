import type * as acorn from "acorn";
import { isNode } from "./ast-utils";

// Expression validation — the guardrail. Walks a parsed expression and throws on
// anything that shouldn't run; safer-eval.ts compiles only what this approves.
// Guardrail, NOT a sandbox: a computed key (`obj["con"+"structor"]`) escapes it.
// Full threat model: the Expressions docs page, § Safety.

// Which EntryError reason an evaluation failure maps to. Defaults to
// "sandbox-violation" (every policy rejection in this file); the parse and
// allowlist sites in safer-eval.ts override it.
export type SaferEvalErrorReason =
  | "expression-syntax"
  | "sandbox-violation"
  | "unknown-reference";

export class SaferEvalError extends Error {
  readonly reason: SaferEvalErrorReason;

  constructor(
    message: string,
    reason: SaferEvalErrorReason = "sandbox-violation",
  ) {
    super(message);
    this.name = "SaferEvalError";
    this.reason = reason;
  }
}

// `eval` / `arguments` can't be shadowed as strict-mode params, so reject them as
// references here instead (the rest are shadowed — see GLOBALS_TO_SHADOW).
const FORBIDDEN_IDENTIFIERS = new Set(["eval", "arguments"]);

// Most dangerous syntax never reaches this walk: every expression is parsed as
// `"use strict"; void (EXPR)`, so a top-level statement / declaration / `with` /
// octal / import is a syntax error. What survives, to reject by hand, is below.

// Forbidden everywhere, even in a function body: dynamic `import()` loads code,
// and `import.meta` / `new.target` (MetaProperty) reach host / constructor
// internals. Keywords, so shadowing can't touch them — block structurally.
const FORBIDDEN_EXPRESSIONS = new Set(["ImportExpression", "MetaProperty"]);

// Forbidden as the whole expression (which must be one pure value); fine inside a
// callback body where imperative code is allowed.
const BODY_ONLY_EXPRESSIONS = new Set([
  "AssignmentExpression", // x = 1, x += 1
  "UpdateExpression", // x++, --x
  "SequenceExpression", // a, b — comma operator
]);

// Escape-hatch property names: `.constructor` reaches the Function constructor,
// `.__proto__` the prototype chain. Only static keys are caught; a computed key
// escapes (the guardrail gap — banning it would ban all `arr[i]` access).
const FORBIDDEN_PROPERTIES = new Set([
  "constructor",
  "__proto__",
  "prototype",
  "__defineGetter__",
  "__defineSetter__",
  "__lookupGetter__",
  "__lookupSetter__",
]);

// The names the engine injects into every expression. A write rooted at one of
// them is a side effect on shared state, so it is rejected at any depth — unlike
// a plain assignment, which is legal inside a body (a `.reduce` accumulator, a
// local). Only a literal `scopes.…` target is visible here: aliasing it first
// (`const s = scopes.root; s.x = 1`) is undecidable statically, so purity stays
// a contract. See the Expressions docs page, § Pure and stateless.
const PROTECTED_ROOTS = new Set(["scopes", "evt", "currentValue"]);

// Walk a write target down to the identifier it is rooted at:
// `scopes.root.a[i]` → "scopes"; `acc.total` → "acc"; `[a, b]` → null.
function writeTargetRoot(node: acorn.AnyNode | null | undefined): string | null {
  if (!node || typeof node !== "object") return null;
  if (node.type === "Identifier") return node.name;
  if (node.type === "MemberExpression") return writeTargetRoot(node.object);
  return null;
}

// Every identifier a write lands on, including through destructuring patterns
// (`[scopes.root.a] = xs`, `({ x: scopes.root.a } = o)`).
function writeTargetRoots(node: acorn.AnyNode | null | undefined): string[] {
  if (!node || typeof node !== "object") return [];
  switch (node.type) {
    case "ArrayPattern":
      return node.elements.flatMap((e) => writeTargetRoots(e));
    case "ObjectPattern":
      return node.properties.flatMap((prop) =>
        writeTargetRoots(prop.type === "Property" ? prop.value : prop.argument),
      );
    case "AssignmentPattern":
      return writeTargetRoots(node.left);
    case "RestElement":
      return writeTargetRoots(node.argument);
    default: {
      const root = writeTargetRoot(node);
      return root ? [root] : [];
    }
  }
}

function rejectProtectedWrite(target: acorn.AnyNode | null | undefined): void {
  for (const root of writeTargetRoots(target)) {
    if (PROTECTED_ROOTS.has(root)) {
      throw new SaferEvalError(
        `Assigning to "${root}" is not allowed — expressions compute a value; write state through a step's "set" field`,
      );
    }
  }
}

// Recursively walk the parsed expression, throwing on anything disallowed.
// insideFunctionBody flips once inside an arrow / function body, where the
// BODY_ONLY_EXPRESSIONS become legal. Entry point is acorn's Program node.
export function validateNode(
  node: acorn.AnyNode | null | undefined,
  insideFunctionBody = false,
): void {
  if (!node || typeof node !== "object") return;

  // The wrapped program must hold exactly one expression (the filter drops the
  // "use strict" directive). More than one means the expr smuggled a `)` to break
  // out of `void (...)` — e.g. `1); evil(); (2`.
  if (node.type === "Program") {
    const statements = node.body.filter(
      (s) => !(s.type === "ExpressionStatement" && s.directive),
    );
    if (statements.length !== 1) {
      throw new SaferEvalError(
        `Expression must be a single expression, got ${statements.length} statements`,
      );
    }
    validateNode(statements[0]);
    return;
  }

  // Dynamic import / meta-properties: never allowed, not even in a body.
  if (FORBIDDEN_EXPRESSIONS.has(node.type)) {
    throw new SaferEvalError(`"${node.type}" is not allowed in expressions`);
  }

  // Assignment / update / comma: allowed in a callback body, not as the whole expr.
  if (BODY_ONLY_EXPRESSIONS.has(node.type) && !insideFunctionBody) {
    throw new SaferEvalError(
      `"${node.type}" is only allowed inside a function body, not as the whole expression`,
    );
  }

  // Writing to injected state, at any depth — a function body makes assignment
  // legal, not assignment *to `scopes`*.
  if (node.type === "AssignmentExpression") rejectProtectedWrite(node.left);
  if (node.type === "UpdateExpression") rejectProtectedWrite(node.argument);
  if (node.type === "UnaryExpression" && node.operator === "delete")
    rejectProtectedWrite(node.argument);

  // An immediately-invoked function is the only way to run statements in an
  // expression, and everything it can express a ternary can too. Rejecting it
  // keeps the grammar to one value; a callback *passed* to `.map` / `.reduce` is
  // untouched, since its callee is the method, not a function literal.
  if (node.type === "CallExpression") {
    const callee =
      node.callee.type === "ParenthesizedExpression"
        ? node.callee.expression
        : node.callee;
    if (
      callee.type === "ArrowFunctionExpression" ||
      callee.type === "FunctionExpression"
    ) {
      throw new SaferEvalError(
        "Immediately-invoked functions are not allowed — an expression must be a single value; use a ternary",
      );
    }
  }

  // Tagged templates invoke an arbitrary tag function.
  if (node.type === "TaggedTemplateExpression") {
    throw new SaferEvalError("Tagged template literals are not allowed");
  }

  // Static access to escape-hatch properties; dynamic keys slip past.
  if (node.type === "MemberExpression") {
    const { property, computed } = node;
    const staticKey =
      !computed && property.type === "Identifier"
        ? property.name
        : computed &&
            property.type === "Literal" &&
            typeof property.value === "string"
          ? property.value
          : null;
    if (staticKey !== null && FORBIDDEN_PROPERTIES.has(staticKey)) {
      throw new SaferEvalError(`Access to "${staticKey}" is not allowed`);
    }
  }

  // `eval` / `arguments` in reference position (the recursion below skips a
  // non-computed member's `.property`, so a harmless `row.arguments` isn't hit).
  if (node.type === "Identifier" && FORBIDDEN_IDENTIFIERS.has(node.name)) {
    throw new SaferEvalError(`Access to "${node.name}" is not allowed`);
  }

  // Recurse. Two carries: descending into a function `body` sets
  // insideFunctionBody for the subtree; a non-computed member's `.property` is a
  // name already checked, so skip it (a computed `obj[eval]` is not skipped).
  const fields = node as unknown as Record<string, unknown>;
  const isFunction =
    node.type === "ArrowFunctionExpression" ||
    node.type === "FunctionExpression";
  for (const key of Object.keys(node)) {
    if (key === "type" || key === "start" || key === "end") continue;
    if (node.type === "MemberExpression" && !node.computed && key === "property")
      continue;
    const child = fields[key];
    const childInside = insideFunctionBody || (isFunction && key === "body");
    if (Array.isArray(child)) {
      for (const c of child) {
        if (isNode(c)) validateNode(c, childInside);
      }
    } else if (isNode(child)) {
      validateNode(child, childInside);
    }
  }
}
