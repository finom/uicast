import { ALLOWED_GLOBALS } from "../expr/globals";
import EXPRESSIONS from "./md/EXPRESSIONS.json" with { type: "json" };

export type ExpressionsPromptOptions = {
	/**
	 * Extra global names to print alongside the built-in safe set — the same
	 * list passed to `<RendererProvider allowGlobals>`. Pass it in both places:
	 * the prop widens the evaluator, this widens what the model is told it may
	 * reference, and a global the model was never told about is unreachable.
	 */
	allowGlobals?: string[];
};

/**
 * The `# JavaScript Expressions` block — the micro-expression syntax contract
 * the generation LLM follows when authoring `expr` values (props, hidden,
 * seed, callbacks). Catalog-/app-agnostic: it documents only the evaluator
 * surface (allowed syntax, the `scopes` / `evt` context variables), not any
 * specific host functions.
 *
 * Authored in `md/EXPRESSIONS.md` and imported as a JSON string via the
 * md-to-json pipeline (`npm run md-to-json` regenerates the `.json` sibling
 * after edits). The doc carries a visible `🔴ALLOWED_GLOBALS🔴` slot that this
 * builder fills from `globals.ts` (the single source of truth for the sandbox
 * allow-list) so the prompt can never drift from what the evaluator actually
 * permits.
 *
 * A partial-prompt primitive: the consuming app's prompt assembler composes
 * this — alongside the other `get*PartialPrompt` builders — into the full
 * system prompt. The closing line refers to host functions "listed below",
 * so the app should join its function-list partial (e.g.
 * `getFunctionsPartialPrompt({ functions })`) as a later section. core
 * ships the pieces; the app owns the assembly.
 */
export function getExpressionsPartialPrompt({
	allowGlobals = [],
}: ExpressionsPromptOptions = {}): string {
	// Deduplicated so listing a built-in by mistake doesn't print it twice.
	const globals = [...new Set([...ALLOWED_GLOBALS, ...allowGlobals])].join(", ");
	return EXPRESSIONS.replace("🔴ALLOWED_GLOBALS🔴", globals);
}
