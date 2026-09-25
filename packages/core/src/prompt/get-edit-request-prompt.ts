import { joinSections } from "./format";

/**
 * Options for `getEditRequestPrompt`.
 *
 * @example
 * const options: EditRequestPromptOptions = { request: "Add a total row.", missingKeys: ["totals"] };
 */
export type EditRequestPromptOptions = {
  /** The change the user asked for, in their words. */
  request: string;
  /** Keys named in `children` but never emitted, as after a cut-off response. The model is told to emit them. */
  missingKeys?: string[];
};

/**
 * A user message asking the model to change a page it made, by emitting only the entries that change. One turn's
 * content, not part of the system prompt.
 *
 * @example
 * const messages = [
 *   { role: "assistant", content: stored.map((entry) => JSON.stringify(entry)).join("\n") },
 *   { role: "user", content: getEditRequestPrompt({ request: "Make the total large." }) },
 * ];
 */
export function getEditRequestPrompt({ request, missingKeys = [] }: EditRequestPromptOptions): string {
  return joinSections(
    request,
    "Update the previously generated page above. Emit ONLY the entries that change: re-emit an existing key to replace that entry (its new `children` array defines the new subtree — children you still reference are kept as-is, so do not re-emit them), use fresh keys for new entries, and do not re-emit unchanged entries. Never re-emit the whole page. `seed` on re-emitted keys does NOT re-run — initialize any NEW state via the `seed` of a newly-keyed entry instead.",
    missingKeys.length > 0 &&
      `Warning: the page above references child keys that were never emitted (the earlier response was cut off): ${missingKeys.join(", ")}. These entries do NOT exist — emit them now, or re-emit their parents with corrected children.`,
  );
}
