import { type EntryErrorReason, FAULT_BY_REASON, REASON_DESCRIPTIONS } from "../entry-error";

/**
 * One failed element, for `getErrorRecoveryPrompt`.
 *
 * @example
 * const failure: RenderFailure = { key: "chart", message: error.message, reason: error.reason };
 */
export type RenderFailure = {
  /** The failed element's key. */
  key: string;
  /** What went wrong, e.g. the error's `message`. */
  message: string;
  /** Adds what this kind of failure means to the line; a reason whose fault is `"environment"` adds nothing. */
  reason?: EntryErrorReason;
};

/**
 * Options for `getErrorRecoveryPrompt`.
 *
 * @example
 * const options: ErrorRecoveryPromptOptions = { failures: [{ key: "chart", message: error.message }] };
 */
export type ErrorRecoveryPromptOptions = {
  /** One per failed element. */
  failures: RenderFailure[];
};

/**
 * A user message naming the elements that failed, so the model sends fixed ones under the same keys. One turn's
 * content, not part of the system prompt.
 *
 * @example
 * getErrorRecoveryPrompt({
 *   failures: [{ key: "chart", message: "chartData.map is not a function", reason: "expression-runtime" }],
 * });
 */
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
    "Rendered UI has errors:",
    list,
    "Re-emit each failed entry fixed, same `key`. Fix cause: when it comes from another entry (like `seed` elsewhere), fix that entry too.",
  ].join("\n\n");
}
