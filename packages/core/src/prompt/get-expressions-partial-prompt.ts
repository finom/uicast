import { ALLOWED_GLOBALS } from "../expr/allowed-globals";
import EXPRESSIONS from "./md/EXPRESSIONS.json" with { type: "json" };

/**
 * The `# JavaScript Expressions` block — the micro-expression syntax contract
 * the generation LLM follows when authoring `expr` values (props, hidden,
 * defaults, callbacks). Catalog-/app-agnostic: it documents only the evaluator
 * surface (allowed syntax, the `scopes` / `evt` context variables), not any
 * specific host functions.
 *
 * Authored in `md/EXPRESSIONS.md` and imported as a JSON string via the
 * md-to-json pipeline (`npm run md-to-json` regenerates the `.json` sibling
 * after edits). The doc carries a visible `🔴ALLOWED_GLOBALS🔴` slot that this
 * builder fills from `allowed-globals.ts` (the single source of truth for the
 * sandbox allow-list) so the prompt can never drift from what the evaluator
 * actually permits.
 *
 * A partial-prompt primitive: the consuming app's prompt assembler composes
 * this — alongside the other `get*PartialPrompt` builders — into the full
 * system prompt. The closing line refers to RPC/host functions "listed below",
 * so the app should join its function-list partial (e.g.
 * `getFunctionsPartialPrompt(tools)`) as the next section after this one. core
 * ships the pieces; the app owns the assembly.
 */
export function getExpressionsPartialPrompt(): string {
	const globals = ALLOWED_GLOBALS.join(", ");
	return EXPRESSIONS.replace("🔴ALLOWED_GLOBALS🔴", globals);
}
