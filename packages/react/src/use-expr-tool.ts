import { EntryError, type ExpressionEvaluator } from "@uicast/core";
import { evaluate, EXPR_TOOL_MAX_READ, exprToolSchemas } from "@uicast/core/internal";
import type { ExprToolInput, ExprToolOutput } from "@uicast/core/tool";
import { useCallback, useMemo } from "react";
import { runStepsNow } from "./impl/run-callback-steps";
import { useConfirm } from "./providers/confirm";
import { useRendererGroup, useRendererRegistry } from "./providers/renderer-provider";

// Errors name this as the element, so the model sees which call failed.
const ELEMENT_KEY = "expr tool";

type StandardToolV0 = ExpressionEvaluator["functions"][number];

// The UI's host functions a call names. One that doesn't parse names none here and fails classified when it runs.
const calledFunctions = ({ steps = [], read }: ExprToolInput, evaluator: ExpressionEvaluator): string[] =>
  [...steps.flatMap((step) => ("expr" in step ? [step.expr] : [])), ...(read === undefined ? [] : [read])].flatMap(
    (expr) => {
      try {
        return evaluator.validate(expr).toolCalls;
      } catch {
        return [];
      }
    },
  );

const failure = (err: unknown): ExprToolOutput => {
  const { reason, message } = EntryError.is(err) ? err : EntryError.wrap(err, "unknown");
  return { error: { reason, message } };
};

/**
 * Runs the `expr` tool's calls (`exprTool()` from `@uicast/core/tool`) against the state of every `<EntriesRenderer>`
 * under this `<RendererProvider>`. Call it below the provider; hand the answer back to the model. Give it the `read` and
 * `functions` that `exprTool()` got. Without `read`, a call that asks for a value is refused. With `functions` (keep
 * the array the same across renders), the tool calls those instead of the provider's, and a call naming another of the
 * provider's is refused before any step runs.
 *
 * @example
 * const runExprTool = useExprTool({ functions: [listCustomers, getCustomer] });
 * onToolCall: async ({ toolCall }) => {
 *   if (toolCall.toolName === "expr") addToolOutput({ tool: "expr", toolCallId: toolCall.toolCallId, output: await runExprTool(toolCall.input) });
 * };
 */
export function useExprTool({
  read: canRead = false,
  functions,
}: {
  read?: boolean;
  functions?: readonly StandardToolV0[];
} = {}): (input: unknown) => Promise<ExprToolOutput> {
  const { scopes } = useRendererGroup();
  const { evaluator: uiEvaluator } = useRendererRegistry();
  const evaluator = useMemo(
    () => (functions ? uiEvaluator.withFunctions(functions) : uiEvaluator),
    [uiEvaluator, functions],
  );
  const confirm = useConfirm();
  return useCallback(
    async (input) => {
      const parsed = exprToolSchemas(canRead).input["~standard"].validate(input);
      if (parsed.issues) {
        const issues = parsed.issues.map(({ path, message }) =>
          path?.length ? `${path.join(".")}: ${message}` : message,
        );
        return { error: { reason: "invalid-entry", message: issues.join("; ") } };
      }
      const own = new Set(evaluator.functions.map(({ name }) => name));
      const missing = new Set(calledFunctions(parsed.value, uiEvaluator).filter((name) => !own.has(name)));
      if (missing.size) {
        const calls = own.size ? `only ${[...own].join(", ")}` : "no function";
        return {
          error: {
            reason: "unknown-reference",
            message: `${[...missing].map((name) => `"${name}"`).join(", ")}: not available to the expr tool, which calls ${calls}`,
          },
        };
      }
      const { steps = [], read } = parsed.value;
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
    [scopes, confirm, evaluator, uiEvaluator, canRead],
  );
}
