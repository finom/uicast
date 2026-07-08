export type RenderFailure = {
	/** The `key` of the element whose render failed. */
	key: string;
	/** The runtime error message, verbatim. */
	message: string;
};

export type ErrorRecoveryPromptOptions = {
	/** The failures to report, one per failed element. */
	failures: RenderFailure[];
};

/**
 * The user-turn message for user-triggered error recovery: an element failed
 * at runtime (its error slot rendered), and the host asks the model to re-emit
 * it corrected. Deliberately surface-neutral — it states the failures and the
 * fix request, while the output conventions come from the surface's own
 * prompt: on a page surface the host passes this through its edit pipeline
 * (replayed document + `getEditRequestPrompt`, which carries the delta
 * convention), on a chat surface it goes out as a plain user message and the
 * model replies with a corrected fence.
 *
 * Not a system-prompt partial: this is per-turn message content, composed by
 * the host into `messages`, not into `system`.
 */
export function getErrorRecoveryPrompt({
	failures,
}: ErrorRecoveryPromptOptions): string {
	const list = failures
		.map((failure) => `- Element \`${failure.key}\`: ${failure.message}`)
		.join("\n");
	return [
		"The generated UI hit runtime errors:",
		list,
		"Diagnose each failure and emit a corrected version of the failed element, keeping its `key`. Fix the cause, not just the reported line — if the error comes from state or an expression that another element sets up (e.g. a `seed` elsewhere), correct that element as well.",
	].join("\n\n");
}
