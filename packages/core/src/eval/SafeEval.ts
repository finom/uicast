import * as acorn from "acorn";

/**
 * SafeEval - A secure JavaScript expression evaluator.
 *
 * Executes JS expressions with a provided context while preventing
 * access to the global scope, prototype chain exploits, and
 * non-expression code (loops, assignments, function declarations, etc.)
 *
 * Supports Proxy objects in context - everything runs in the same realm.
 *
 * @example
 *   const evaluator = new SafeEval();
 *   const result = evaluator.eval(
 *     'orders.filter(o => o.active).reduce((sum, o) => sum + o.total, 0)',
 *     { orders: [{ active: true, total: 50 }, { active: false, total: 30 }] }
 *   );
 *   // result: 50
 */

// --- Globals to shadow ---
// We shadow these by declaring them as parameters set to `undefined`,
// so any reference inside the expression resolves to `undefined` instead
// of the real global.
const GLOBALS_TO_SHADOW = [
  // Global objects
  "globalThis",
  "self",
  "window",
  "global",
  "document",
  "navigator",
  "location",
  "history",
  "localStorage",
  "sessionStorage",
  "indexedDB",

  // Dangerous APIs
  "fetch",
  "XMLHttpRequest",
  "WebSocket",
  "EventSource",
  "Worker",
  "SharedWorker",
  "ServiceWorker",
  "importScripts",

  // Code execution
  // NOTE: "eval" and "arguments" cannot be parameter names in strict mode.
  // They are blocked at the AST level instead (see FORBIDDEN_IDENTIFIERS).
  "Function",
  "setTimeout",
  "setInterval",
  "setImmediate",
  "requestAnimationFrame",
  "requestIdleCallback",
  "queueMicrotask",

  // Process / Node
  "process",
  "require",
  "module",
  "exports",
  "__dirname",
  "__filename",
  "Buffer",

  // DOM
  "alert",
  "confirm",
  "prompt",
  "close",
  "open",
  "print",
  "postMessage",

  // Constructors that can escape
  "Proxy",
  "Reflect",
  "SharedArrayBuffer",
  "Atomics",
];

// --- Forbidden identifiers (can't be shadowed as params in strict mode) ---
const FORBIDDEN_IDENTIFIERS = new Set(["eval", "arguments"]);

// --- Forbidden AST node types ---
// Only expressions are allowed. These node types indicate statements,
// declarations, or other non-expression constructs.
const FORBIDDEN_NODE_TYPES = new Set([
  // Declarations
  "VariableDeclaration",
  "FunctionDeclaration",
  "ClassDeclaration",
  "ImportDeclaration",
  "ExportNamedDeclaration",
  "ExportDefaultDeclaration",
  "ExportAllDeclaration",

  // Statements
  "BlockStatement",
  "ExpressionStatement", // we handle the top-level one specially
  "IfStatement",
  "SwitchStatement",
  "ForStatement",
  "ForInStatement",
  "ForOfStatement",
  "WhileStatement",
  "DoWhileStatement",
  "TryStatement",
  "ThrowStatement",
  "ReturnStatement",
  "BreakStatement",
  "ContinueStatement",
  "LabeledStatement",
  "WithStatement",
  "DebuggerStatement",
  "EmptyStatement",

  // Other
  "SequenceExpression", // prevents (sideEffect1, sideEffect2, returnValue)
  "AssignmentExpression", // a = b, a += b, etc.
  "UpdateExpression", // a++, --b
  "YieldExpression",
  "ImportExpression", // dynamic import()
  "MetaProperty", // import.meta, new.target
]);

// --- Safe constructors allowed with `new` ---
const SAFE_NEW_CONSTRUCTORS = new Set([
  "Date",
  "Array",
  "Object",
  "Map",
  "Set",
  "WeakMap",
  "WeakSet",
  "RegExp",
  "Error",
  "TypeError",
  "RangeError",
  "SyntaxError",
  "ReferenceError",
  "URIError",
  "EvalError",
  "Number",
  "String",
  "Boolean",
  "Int8Array",
  "Uint8Array",
  "Uint8ClampedArray",
  "Int16Array",
  "Uint16Array",
  "Int32Array",
  "Uint32Array",
  "Float32Array",
  "Float64Array",
  "BigInt64Array",
  "BigUint64Array",
  "ArrayBuffer",
  "DataView",
  "URL",
  "URLSearchParams",
  "TextEncoder",
  "TextDecoder",
]);

// --- Forbidden property names accessed on any object ---
const FORBIDDEN_PROPERTIES = new Set([
  "constructor",
  "__proto__",
  "prototype",
  "__defineGetter__",
  "__defineSetter__",
  "__lookupGetter__",
  "__lookupSetter__",
]);

// --- AST Validation ---

interface ASTNode {
  type: string;
  start?: number;
  end?: number;
  body?: ASTNode[];
  expression?: ASTNode;
  property?: ASTNode & { name?: string; value?: string | number | boolean };
  computed?: boolean;
  name?: string;
  op?: string;
  args?: ASTNode[];
  [key: string]: unknown;
}

/**
 * Recursively walks the AST and throws if any forbidden node or
 * property access is found.
 */
function validateNode(
  node: ASTNode | null | undefined,
  isRoot = false,
  isPropertyName = false,
  insideArrowBody = false,
): void {
  if (!node || typeof node !== "object") return;

  if (node.type) {
    // Allow top-level ExpressionStatement (the wrapper acorn creates)
    // and Program, but nothing else from the forbidden set.
    if (node.type === "Program") {
      if (!node.body || node.body.length !== 1) {
        throw new SafeEvalError(
          "Expression must be a single expression, got " +
            (node.body?.length ?? 0) +
            " statements",
        );
      }
      validateNode(node.body[0], true);
      return;
    }

    if (node.type === "ExpressionStatement" && isRoot) {
      validateNode(node.expression);
      return;
    }

    // Inside arrow function bodies, allow block-related constructs
    // (BlockStatement, ReturnStatement, VariableDeclaration) since
    // arrow functions with block bodies are valid expressions:
    //   items.reduce((acc, item) => { const x = item.v; return acc + x; }, 0)
    const ARROW_BODY_ALLOWED = new Set([
      "BlockStatement",
      "ReturnStatement",
      "VariableDeclaration",
      "ExpressionStatement",
      "AssignmentExpression",
      "IfStatement",
    ]);

    if (FORBIDDEN_NODE_TYPES.has(node.type)) {
      if (!(insideArrowBody && ARROW_BODY_ALLOWED.has(node.type))) {
        throw new SafeEvalError(
          `Forbidden syntax: "${node.type}" is not allowed in expressions`,
        );
      }
    }

    // Block tagged template literals - they can call arbitrary functions
    if (node.type === "TaggedTemplateExpression") {
      throw new SafeEvalError(
        "Tagged template literals are not allowed in expressions",
      );
    }

    // Check for property access to forbidden property names
    if (node.type === "MemberExpression" && !node.computed) {
      if (
        node.property &&
        (node.property as ASTNode).type === "Identifier" &&
        FORBIDDEN_PROPERTIES.has(
          (node.property as ASTNode & { name: string }).name,
        )
      ) {
        throw new SafeEvalError(
          `Access to "${(node.property as ASTNode & { name: string }).name}" is not allowed`,
        );
      }
    }

    // Check computed property access with string literals like obj["constructor"]
    if (node.type === "MemberExpression" && node.computed) {
      if (
        node.property &&
        (node.property as ASTNode).type === "Literal" &&
        typeof (node.property as ASTNode & { value: unknown }).value ===
          "string" &&
        FORBIDDEN_PROPERTIES.has(
          (node.property as ASTNode & { value: string }).value,
        )
      ) {
        throw new SafeEvalError(
          `Access to "${(node.property as ASTNode & { value: string }).value}" is not allowed`,
        );
      }
    }

    // Prevent `new` - only allow safe built-in constructors
    if (node.type === "NewExpression") {
      const callee = node.callee as ASTNode | undefined;
      const isSafe =
        callee?.type === "Identifier" &&
        SAFE_NEW_CONSTRUCTORS.has(callee.name!);
      if (!isSafe) {
        throw new SafeEvalError(
          `"new" expressions are only allowed for safe built-in constructors (${[...SAFE_NEW_CONSTRUCTORS].join(", ")})`,
        );
      }
    }

    // Block forbidden identifiers (eval, arguments) when used as
    // variable references - but allow them as property names (obj.eval is fine)
    if (
      node.type === "Identifier" &&
      !isPropertyName &&
      FORBIDDEN_IDENTIFIERS.has(node.name!)
    ) {
      throw new SafeEvalError(`Access to "${node.name}" is not allowed`);
    }
  }

  // Recurse into all child nodes
  for (const key of Object.keys(node)) {
    if (key === "type" || key === "start" || key === "end") continue;
    const child = node[key];

    // Determine if this child is a non-computed property name
    const childIsPropertyName =
      node.type === "MemberExpression" && !node.computed && key === "property";

    // Track when we enter an arrow function body
    const childInsideArrowBody =
      insideArrowBody ||
      (node.type === "ArrowFunctionExpression" && key === "body");

    if (Array.isArray(child)) {
      child.forEach((c: ASTNode) =>
        validateNode(c, false, false, childInsideArrowBody),
      );
    } else if (child && typeof child === "object" && (child as ASTNode).type) {
      validateNode(
        child as ASTNode,
        false,
        childIsPropertyName,
        childInsideArrowBody,
      );
    }
  }
}

/**
 * Check whether the AST contains any AwaitExpression node.
 */
function containsAwait(node: ASTNode | null | undefined): boolean {
  if (!node || typeof node !== "object") return false;
  if (node.type === "AwaitExpression") return true;
  for (const key of Object.keys(node)) {
    if (key === "type" || key === "start" || key === "end") continue;
    const child = node[key];
    if (Array.isArray(child)) {
      for (const c of child) {
        if (c && typeof c === "object" && containsAwait(c as ASTNode))
          return true;
      }
    } else if (child && typeof child === "object" && (child as ASTNode).type) {
      if (containsAwait(child as ASTNode)) return true;
    }
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
function collectChain(node: ASTNode | null | undefined): string[] | null {
  const parts: string[] = [];
  let cur: ASTNode | null | undefined = node;
  while (cur) {
    if (cur.type === "MemberExpression") {
      if (cur.computed) return null;
      const prop = cur.property as ASTNode | undefined;
      if (!prop || prop.type !== "Identifier") return null;
      parts.unshift((prop as ASTNode & { name: string }).name);
      cur = cur.object as ASTNode | undefined;
    } else if (cur.type === "Identifier") {
      parts.unshift((cur as ASTNode & { name: string }).name);
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
function walkComputedKeysWithin(
  memberExpr: ASTNode,
  out: Set<string>,
): void {
  let cur: ASTNode | undefined = memberExpr;
  while (cur?.type === "MemberExpression") {
    if (cur.computed && cur.property) {
      walkScopeReads(cur.property as ASTNode, out);
    }
    cur = cur.object as ASTNode | undefined;
  }
}

/**
 * Recursive AST walker. Public entry point is `extractScopeReads(ast)`.
 */
function walkScopeReads(
  node: ASTNode | null | undefined,
  out: Set<string>,
): void {
  if (!node || typeof node !== "object") return;

  // CallExpression: if callee is a MemberExpression like `scopes.X.Y.method`,
  // record `scopes.X.Y` (drop the method name). The trailing segment is a
  // method dispatch, not a data read.
  if (node.type === "CallExpression") {
    const callee = node.callee as ASTNode | undefined;
    if (callee?.type === "MemberExpression" && !callee.computed) {
      const chain = collectChain(callee.object as ASTNode);
      if (chain && chain[0] === "scopes" && chain.length > 1) {
        out.add(chain.join("."));
        // The callee's object may itself contain computed sub-keys we missed.
        walkComputedKeysWithin(callee.object as ASTNode, out);
      } else {
        walkScopeReads(callee.object as ASTNode, out);
      }
    } else if (callee) {
      walkScopeReads(callee, out);
    }
    for (const arg of (node.arguments as ASTNode[] | undefined) ?? []) {
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
    walkScopeReads(node.object as ASTNode, out);
    if (node.computed && node.property) {
      walkScopeReads(node.property as ASTNode, out);
    }
    return;
  }

  // Generic recursion for everything else (ArrowFunction body, Object/Array
  // literals, conditional/logical expressions, template literals, etc.).
  for (const key of Object.keys(node)) {
    if (key === "type" || key === "start" || key === "end") continue;
    const child = node[key];
    if (Array.isArray(child)) {
      for (const c of child) {
        walkScopeReads(c as ASTNode, out);
      }
    } else if (child && typeof child === "object" && (child as ASTNode).type) {
      walkScopeReads(child as ASTNode, out);
    }
  }
}

function extractScopeReads(ast: ASTNode): string[] {
  const out = new Set<string>();
  walkScopeReads(ast, out);
  return [...out];
}

// AsyncFunction constructor for evaluating expressions that use `await`
// eslint-disable-next-line @typescript-eslint/no-empty-function
const AsyncFunction = Object.getPrototypeOf(async function () {})
  .constructor as typeof Function;

// --- Error class ---

export class SafeEvalError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SafeEvalError";
  }
}

// --- SafeEval class ---

type CacheEntry = {
  isAsync: boolean;
  scopeReads: string[];
  // `fn` is lazily populated by `compile()` — `validate()` and `scopeReads()`
  // both fill the entry without paying the `new Function(...)` cost. The
  // first `compile()` (or `eval()`) call upgrades the entry with a real fn.
  fn?: (context: Record<string, unknown>) => unknown;
};

export class SafeEval {
  #cache = new Map<string, CacheEntry>();
  #maxCacheSize: number;
  #shadowParams: string[];

  constructor(
    options: {
      maxCacheSize?: number;
      extraGlobalsToShadow?: string[];
      allowGlobals?: string[];
    } = {},
  ) {
    const {
      maxCacheSize = 500,
      extraGlobalsToShadow = [],
      allowGlobals = [],
    } = options;

    this.#maxCacheSize = maxCacheSize;

    const allowSet = new Set(allowGlobals);
    this.#shadowParams = [...GLOBALS_TO_SHADOW, ...extraGlobalsToShadow].filter(
      (g) => !allowSet.has(g),
    );
  }

  /**
   * Validate an expression string without executing it.
   * Throws SafeEvalError if invalid.
   * Returns analysis output: `isAsync` (uses await) and `scopeReads`
   * (every `scopes.X.Y` path the expression reads, used by the renderer
   * to auto-subscribe to reactive deps so the LLM doesn't have to).
   *
   * Side effect: populates `#cache` with the analysis. The compiled
   * function isn't built until `compile()` / `eval()` is called.
   */
  validate(expression: string): { isAsync: boolean; scopeReads: string[] } {
    if (typeof expression !== "string") {
      throw new SafeEvalError("Expression must be a string");
    }

    const trimmed = expression.trim();
    if (!trimmed) {
      throw new SafeEvalError("Expression cannot be empty");
    }

    // Cache lookup happens upstream of parsing — analysis is stable per
    // expression string, so a second call is free.
    const cached = this.#cache.get(expression);
    if (cached) {
      return { isAsync: cached.isAsync, scopeReads: cached.scopeReads };
    }

    // Parse as a script containing `void (expr)`.
    // This ensures the expression is parsed as an expression (not a statement),
    // so `{...}` is treated as an object literal, not a block.
    // The `void` prefix forces expression context, matching how compile()
    // wraps it as `return (expr)`.
    const wrapper = `void (${trimmed})`;
    let ast: ASTNode;
    try {
      ast = acorn.parse(wrapper, {
        ecmaVersion: 2022,
        sourceType: "script",
        allowAwaitOutsideFunction: true,
      }) as unknown as ASTNode;
    } catch (e: unknown) {
      throw new SafeEvalError(
        `Syntax error: ${e instanceof Error ? e.message : String(e)}. Expression: ${expression}`,
      );
    }

    // ast is Program > ExpressionStatement > UnaryExpression(void) > inner expression
    // Validate the entire tree (validateNode handles Program/ExpressionStatement)
    validateNode(ast);

    const analysis = {
      isAsync: containsAwait(ast),
      scopeReads: extractScopeReads(ast),
    };

    // Insert analysis into cache without a compiled fn — `compile()` will
    // upgrade lazily. Eviction policy mirrors compile()'s.
    if (this.#cache.size >= this.#maxCacheSize) {
      const firstKey = this.#cache.keys().next().value;
      if (firstKey !== undefined) this.#cache.delete(firstKey);
    }
    this.#cache.set(expression, { ...analysis });

    return analysis;
  }

  /**
   * Compile an expression into a reusable function.
   * If the expression uses `await`, the returned function will return a Promise.
   */
  compile(expression: string): (context: Record<string, unknown>) => unknown {
    // validate() populates the cache with analysis (no fn yet) on first call,
    // and is a no-op cache hit on subsequent calls. After this, cache entry
    // exists either with or without a `fn`.
    const { isAsync } = this.validate(expression);
    const entry = this.#cache.get(expression);
    if (entry?.fn) return entry.fn;

    const expr = expression.trim();
    const Ctor = isAsync ? AsyncFunction : Function;

    const evaluator = (context: Record<string, unknown>) => {
      const contextKeys = Object.keys(context);
      const contextValues = Object.values(context);

      // Ensure context keys don't collide with shadow params
      const allParams = [...contextKeys, ...this.#shadowParams];
      const allArgs = [
        ...contextValues,
        ...new Array(this.#shadowParams.length).fill(undefined),
      ];

      // Build and execute (AsyncFunction for await, Function otherwise)
      const fn = new Ctor(...allParams, `"use strict"; return (${expr})`);

      return fn(...allArgs);
    };

    // Upgrade the entry validate() inserted with the compiled evaluator.
    // The entry must exist here — validate() just put it there above.
    if (entry) {
      entry.fn = evaluator;
    } else {
      // Defensive: should never happen, but mirror the original eviction.
      if (this.#cache.size >= this.#maxCacheSize) {
        const firstKey = this.#cache.keys().next().value;
        if (firstKey !== undefined) this.#cache.delete(firstKey);
      }
      this.#cache.set(expression, {
        fn: evaluator,
        isAsync,
        scopeReads: [],
      });
    }

    return evaluator;
  }

  /**
   * Check whether a given expression uses `await` (and will therefore return a Promise).
   */
  isAsync(expression: string): boolean {
    const cached = this.#cache.get(expression);
    if (cached) return cached.isAsync;
    return this.validate(expression).isAsync;
  }

  /**
   * Return every `scopes.X.Y` path the expression reads. Used by the renderer
   * to auto-subscribe to reactive deps — the LLM no longer specifies a `deps`
   * array, this derives it from the expression text via static AST walk.
   *
   * - Stops at call-method segments (`.filter`, `.map`) — methods are not deps.
   * - Stops at computed keys (`scopes.x[i]` → `scopes.x` only; the index path
   *   `i` is walked recursively if it itself reads scopes).
   * - Returns the de-duplicated leaf paths in arbitrary order.
   */
  scopeReads(expression: string): string[] {
    const cached = this.#cache.get(expression);
    if (cached) return cached.scopeReads;
    return this.validate(expression).scopeReads;
  }

  /**
   * Evaluate an expression with the given context.
   */
  eval(expression: string, context: Record<string, unknown> = {}): unknown {
    const evaluator = this.compile(expression);
    return evaluator(context);
  }

  /**
   * Clear the expression cache.
   */
  clearCache(): void {
    this.#cache.clear();
  }
}

export default SafeEval;
