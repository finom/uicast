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
    "Change page above. Emit ONLY entries that change: re-emit key to replace its entry (new `children` define its subtree; listed old children stay, don't re-emit them); new keys for new entries. Never re-emit whole page. Re-emitted `seed` doesn't run again: new state goes in new key's `seed`.",
    missingKeys.length > 0 &&
      `Warning: page lists keys never emitted (earlier response cut off): ${missingKeys.join(", ")}. They do NOT exist: emit them, or re-emit their parents with fixed \`children\`.`,
  );
}
