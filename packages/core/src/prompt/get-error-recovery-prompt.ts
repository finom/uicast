import { type EntryErrorReason, FAULT_BY_REASON, REASON_DESCRIPTIONS } from "../entry-error";

export type RenderFailure = {
	key: string;
	message: string;
	// Annotates the line with what that class of failure means.
	reason?: EntryErrorReason;
};

export type ErrorRecoveryPromptOptions = {
	failures: RenderFailure[];
};

// Per-turn content, not a system-prompt partial.
export function getErrorRecoveryPrompt({ failures }: ErrorRecoveryPromptOptions): string {
	const list = failures
		.map(({ key, message, reason }) => {
			const line = `- Entry \`${key}\`: ${message}`;
			// Environment faults are not the model's to fix.
			if (!reason || FAULT_BY_REASON[reason] === "environment") return line;
			return `${line} (${reason} — ${REASON_DESCRIPTIONS[reason]})`;
		})
		.join("\n");
	return [
		"The generated UI hit runtime errors:",
		list,
		"Diagnose each failure and emit a corrected version of the failed entry, keeping its `key`. Fix the cause, not just the reported line — if the error comes from state or an expression that another entry sets up (e.g. a `seed` elsewhere), correct that entry as well.",
	].join("\n\n");
}
