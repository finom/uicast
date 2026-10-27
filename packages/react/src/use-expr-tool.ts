import { EntryError } from "@uicast/core";
import { evaluate, EXPR_TOOL_MAX_READ, exprToolInput } from "@uicast/core/internal";
import type { ExprToolOutput } from "@uicast/core/tool";
import { useCallback } from "react";
import { runStepsNow } from "./impl/run-callback-steps";
import { useConfirm } from "./providers/confirm";
import { useRendererGroup, useRendererRegistry } from "./providers/renderer-provider";

// Errors name this as the element, so the model sees which call failed.
const ELEMENT_KEY = "expr tool";

const failure = (err: unknown): ExprToolOutput => {
  const { reason, message } = EntryError.is(err) ? err : EntryError.wrap(err, "unknown");
  return { error: { reason, message } };
};

/**
 * Runs the `expr` tool's calls (`exprTool()` from `@uicast/core/tool`) against the state of every `<EntriesRenderer>`
 * under this `<RendererProvider>`. Call it below the provider; hand the answer back to the model.
 *
 * @example
 * const runExprTool = useExprTool();
 * onToolCall: async ({ toolCall }) => {
 *   if (toolCall.toolName === "expr") addToolOutput({ tool: "expr", toolCallId: toolCall.toolCallId, output: await runExprTool(toolCall.input) });
 * };
 */
export function useExprTool(): (input: unknown) => Promise<ExprToolOutput> {
  const { scopes } = useRendererGroup();
  const { evaluator } = useRendererRegistry();
  const confirm = useConfirm();
  return useCallback(
    async (input) => {
      const parsed = exprToolInput.safeParse(input);
      if (!parsed.success) {
        const issues = parsed.error.issues.map(({ path, message }) =>
          path.length ? `${path.join(".")}: ${message}` : message,
        );
        return { error: { reason: "invalid-entry", message: issues.join("; ") } };
      }
      const { steps = [], read } = parsed.data;
      try {
        const run = { payload: undefined, scopes, confirm, evaluator, elementKey: ELEMENT_KEY };
        if (!(await runStepsNow({ steps, ...run }))) return { declined: true };
        if (read === undefined) return {};
        const json = JSON.stringify(await evaluate({ expr: read }, { scopes }, evaluator)) ?? "null";
        if (json.length > EXPR_TOOL_MAX_READ) {
          return {
            error: {
              reason: "budget-exceeded",
              message: `"read" gave ${json.length} characters, over ${EXPR_TOOL_MAX_READ}: pick fields or slice`,
            },
          };
        }
        return { value: JSON.parse(json) };
      } catch (err) {
        return failure(err);
      }
    },
    [scopes, confirm, evaluator],
  );
}
