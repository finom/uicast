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
	/**
	 * Extra host-provided scopes to declare — the same names passed to
	 * `<RendererProvider scopes>`. Each is listed next to `scopes.root` and the
	 * list `as` scopes, so the contract's "invent no other scope" rule stays
	 * true instead of contradicting the host's setup. The description is all
	 * the model ever sees of the scope, so spell out its shape there:
	 * `"the signed-in user: name (string), plan ('free' | 'pro')"`.
	 */
	extraScopes?: { name: string; description: string }[];
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
 * builder fills from `globals.ts` (the single source of truth for the expression
 * allow-list) so the prompt can never drift from what the evaluator actually
 * permits.
 *
 * The closing line refers to host functions "listed below", so join the
 * function-list partial (`getFunctionsPartialPrompt`) as a later section.
 */
export function getExpressionsPartialPrompt({
	allowGlobals = [],
	extraScopes = [],
}: ExpressionsPromptOptions = {}): string {
	// Deduplicated so listing a built-in by mistake doesn't print it twice.
	const globals = [...new Set([...ALLOWED_GLOBALS, ...allowGlobals])].join(", ");
	const scopesTail = extraScopes.length
		? `, plus these host-provided scopes: ${extraScopes
				.map(({ name, description }) => `\`scopes.${name}\` (${description})`)
				.join(", ")}`
		: "";
	// Replacer functions, so `$&` / `$'` in a host-written description are
	// literal text instead of String.replace substitution patterns.
	return EXPRESSIONS.replace("🔴ALLOWED_GLOBALS🔴", () => globals).replace(
		"🔴EXTRA_SCOPES🔴",
		() => scopesTail,
	);
}
