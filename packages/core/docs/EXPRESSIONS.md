# Expressions

`ui-fired` elements carry small JavaScript **expressions** that the renderer
evaluates against reactive scope state. This doc covers where they appear, how
they're evaluated, and why the engine evaluates JavaScript with lightweight AST
validation rather than a sandbox or a dedicated expression language. Expressions
are one part of the **ui-fired** format; its normative contract is
[`SPEC.md`](./SPEC.md).

## Where expressions are used

Every reactive site on an element is an expression. They run through `evaluate()` →
`SafeEval` against a context exposing `scopes`, `evt` (callbacks only), and the
host functions the consumer wires in.

- **`props.expr`** — computes the props object for the component, e.g.
  `({ text: scopes.root.title })`.
- **`defaults[].expr`** — seeds scope state on mount; the result is written to
  the `set` path.
- **`callbacks[].expr`** — runs on an event; reads `evt` and host functions,
  writes via `set`.
- **`hidden`** — a bare expression; the element is hidden when it evaluates truthy.
- **`each`** (lists) — a bare expression returning the array to iterate.

A `literal` value is **not** an expression — it's returned verbatim, never
evaluated. See [`LINES.md`](./LINES.md) for the full line/element shape,
[`SCOPES.md`](./SCOPES.md) for the reactive state model, and [`REACT.md`](./REACT.md)
for the React binding that runs these expressions at render time.

## Examples

Concrete `expr` strings, one group per site. Every example here is a single
expression — the shape the prompt asks for.

**Computed props** (`props.expr`) — build the props object from scope state:

```js
({ text: scopes.root.title })
({ label: `${scopes.cart.items.length} items`, disabled: scopes.cart.items.length === 0 })
({ variant: scopes.order.status === "paid" ? "success" : "warning" })
```

**List source** (`each`) — normally just a **reference** to a state array (the
form the prompt asks for); an inline array-returning expression also works for a
*derived* (filtered/sorted) list:

```js
scopes.root.orders                                   // the asked-for form
scopes.inv.rows.filter(r => r.active)                // derived list — also works
scopes.inv.rows.filter(r => r.qty > 0).sort((a, b) => b.qty - a.qty)
```

**Conditional visibility** (`hidden`) — a bare expression, hidden when truthy:

```js
scopes.cart.items.length === 0
!scopes.user.isAdmin
```

**Defaults** (`defaults[].expr`) — compute a value; the renderer writes it to the
entry's `set` path:

```jsonc
{ "set": "scopes.inv.count", "expr": "scopes.inv.rows.length" }
{ "set": "scopes.form.today", "expr": "new Date().toISOString().slice(0, 10)" }
```

**Callbacks** (`callbacks[].expr`) — read `evt` (whose shape is component-defined,
not limited to DOM events — see [`LINES.md`](./LINES.md#callbacks)), call host
functions (always `await`-ed), and write via `set`:

```jsonc
// mirror an input's value into scope state
{ "set": "scopes.form.query", "expr": "evt.target.value" }
// call a host function — no `set` when the call itself is the whole effect
{ "expr": "await addRow(scopes.sheet.id, scopes.form.draft)" }
```

## Why JavaScript + AST validation

The engine evaluates JavaScript expressions, validated cheaply by walking the
parsed AST (acorn) before execution — rejecting statements, declarations,
assignments and dangerous property/identifier access, and shadowing dangerous
globals. We landed here after testing several alternatives:

- **A sandbox (iframe / VM / realm).** Strong isolation, but slow to spin up per
  evaluation and awkward for state management: the reactive Proxy store has to
  cross the sandbox boundary, which defeats the same-realm Proxy reads/writes the
  renderer depends on.
- **CEL (Common Expression Language).** A purpose-built, safe-by-construction
  expression language — on paper the best fit. In practice the generating model
  struggled to produce valid CEL: its strict typing caused frequent type errors
  in generated expressions.
- **JavaScript with AST validation (chosen).** The model generates JavaScript
  fluently and correctly, evaluation stays in-realm (so Proxy state just works),
  and a single static AST pass gives cheap, predictable safety. The trade-off —
  the validator is a security boundary maintained by hand — is documented at the
  call site in [`../src/expr/validate.ts`](../src/expr/validate.ts).

The `expr/` engine keeps each job in its own small file: `validate.ts` is the
guardrail (the forbidden-expression sets + the AST walk), `safe-eval.ts` compiles
and runs what it approves, and `globals.ts` (`../src/expr/globals.ts`) holds both
the allowed- and shadowed-globals lists — the allow-list also being the source
the prompt's globals section is generated from.

## Prompt simplicity vs. validator tolerance

The generation prompt and the validator are tuned for two different things, on
purpose.

The prompt (`getExpressionsPartialPrompt`) tells the model to keep every `expr`
a **single, simple expression** — no statements, no loops, no `if`/`switch`.
That keeps generated expressions short (fewer tokens) and predictable, which is
what we want in the overwhelming majority of cases.

`SafeEval`, though, deliberately accepts **more** than the prompt advertises:
inside an arrow-function body it allows `if`, `switch`, `for`/`while` loops,
`try`/`catch`, `throw`, and local `const`/`let`. The reason is that the model is
not deterministic — told "no statements," it will still occasionally emit a
`switch` or a `for`. If the validator rejected those, the entire element would
fail to render. By tolerating the safe-but-verbose forms, a stylistic slip
degrades to "works, just longer" instead of a broken UI.

These two produce the same result — the prompt asks for the first, but the
second still renders:

```js
// preferred — a single ternary expression
scopes.order.status === "paid" ? "green" : scopes.order.status === "pending" ? "amber" : "red"

// tolerated — a switch in an arrow IIFE (more tokens, identical result)
(s => { switch (s) { case "paid": return "green"; case "pending": return "amber"; default: return "red"; } })(scopes.order.status)
```

The tolerance is only ever about **verbosity, never about safety**. What the
validator *attempts* to block — everywhere, not just at the top level:

- code execution (`Function` / `eval` / `WebAssembly`),
- ambient globals (`fetch`, `Image`, `Audio`, `process`, …),
- prototype escapes (`constructor` / `__proto__` / `prototype`),
- and the top-level `expr` must still be an expression — statements are
  permitted _only_ nested inside an arrow body.

The validation surface lives in `../src/expr/validate.ts`. Statements are blocked
*structurally* — every expression is parsed wrapped as `void ( … )`, so a
statement at the top level is a syntax error and the validator keeps no list of
them; the statements that survive (nested inside a `=> { … }` body, where the
grammar allows them) are deliberately tolerated. What it still checks by hand is
small: `FORBIDDEN_EXPRESSIONS` (dynamic `import()` / `import.meta`, blocked
everywhere), `BODY_ONLY_EXPRESSIONS` (assignment / update / comma, allowed only
inside a function body), `FORBIDDEN_PROPERTIES`, and `FORBIDDEN_IDENTIFIERS`
(`eval` / `arguments`) — plus the `GLOBALS_TO_SHADOW` list over in `globals.ts`.

## Security — what this does and doesn't stop

**Read this before feeding SafeEval anything you don't control.** The validator
is a **guardrail, not a sandbox**. It raises the bar against a *cooperative*
producer accidentally doing something dangerous; it does **not** contain a
*determined adversary*.

The gap is fundamental to static AST filtering. The `constructor` / `__proto__`
/ `prototype` block only catches **static** keys — dot access, or a
string-*literal* computed key. A **dynamically-computed** key is undecidable at
validation time and reaches the real `Function` constructor at runtime:

```js
// blocked — static literal key:
({})["constructor"]                              // → throws

// NOT blocked — the key is computed, so validation can't see "constructor":
({})["con" + "structor"]                         // → Object constructor
({})[`constructor`]                              // → Object constructor
({})[["constructor"][0]]                         // → Object constructor

// full escape — build an un-sandboxed function and run anything:
({})["con"+"structor"]["con"+"structor"]("return fetch")()   // → the REAL fetch
```

That last line is the point: the function `Function(...)` builds is **not**
AST-validated and gets **none** of the shadow params, so it recovers `fetch`,
`process`, everything — the global shadowing is fully defeated. We can't close
this without banning all computed access (`arr[i]`, `scopes.row[col]`), which
the language needs, so the block stays best-effort by design.

**What this means in practice:**

- Treat every expression author as **semi-trusted**. If untrusted data can steer
  what expression gets generated (e.g. prompt-injection via spreadsheet
  content), assume the expression can run arbitrary JS in the viewer's session.
- Contain at the **product layer**, not here: limit what the host `functions`
  are authorized to do, and treat the rendered page as running
  attacker-influenced code (standard XSS posture).
- To evaluate genuinely adversarial expressions safely, **AST filtering is the
  wrong tool** — isolate out-of-realm (Web Worker / iframe with a serialized
  state bridge) or adopt SES (`lockdown()` + `Compartment`). Both trade away the
  same-realm Proxy reads this engine is built around, which is exactly why we
  didn't take that route.

One thing static validation *also* can't do is bound an infinite loop
(`while (true) {}`): expressions run in the viewer's own browser, so that's a
runtime/timeout concern, not the validator's job.
