import {
	type EntryErrorReason,
	FAULT_BY_REASON,
	REASON_DESCRIPTIONS,
} from "../entry-error";

export type RenderFailure = {
	/** The `key` of the element whose render failed. */
	key: string;
	/** The runtime error message, verbatim. */
	message: string;
	/** The failure's `EntryError.reason`, when the host has it — annotates the line with what that class of failure means. */
	reason?: EntryErrorReason;
};

export type ErrorRecoveryPromptOptions = {
	/** The failures to report, one per failed element. */
	failures: RenderFailure[];
};

/**
 * The user-turn message for error recovery: an element failed at runtime and
 * the host asks the model to re-emit it corrected. Surface-neutral — a page
 * host sends it through its edit pipeline, a chat host as a plain message.
 *
 * Not a system-prompt partial: this is per-turn message content, composed by
 * the host into `messages`, not into `system`.
 */
export function getErrorRecoveryPrompt({
	failures,
}: ErrorRecoveryPromptOptions): string {
	const list = failures
		.map(({ key, message, reason }) => {
			const line = `- Element \`${key}\`: ${message}`;
			// Environment faults aren't the model's to fix — no annotation.
			if (!reason || FAULT_BY_REASON[reason] === "environment") return line;
			return `${line} (${reason} — ${REASON_DESCRIPTIONS[reason]})`;
		})
		.join("\n");
	return [
		"The generated UI hit runtime errors:",
		list,
		"Diagnose each failure and emit a corrected version of the failed element, keeping its `key`. Fix the cause, not just the reported line — if the error comes from state or an expression that another element sets up (e.g. a `seed` elsewhere), correct that element as well.",
	].join("\n\n");
}
