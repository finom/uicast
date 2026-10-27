import type { ExpressionEvaluator } from "@uicast/expr";
import { EXPR_TOOL_MAX_READ } from "../constants";
import { joinSections, noteSection } from "../prompt/format";
import EXPR_TOOL from "../prompt/md/EXPR_TOOL.json" with { type: "json" };
import { exprToolInput, exprToolOutput } from "./schemas";

/**
 * Options for `exprTool`.
 *
 * @example
 * const options: ExprToolOptions = { note: "Selection lives in scopes.root.selected." };
 */
export type ExprToolOptions = {
  /** Your text, appended verbatim as a trailing `## Note`. */
  note?: string;
};

type StandardToolV0 = ExpressionEvaluator["functions"][number];

/**
 * The `expr` tool, a `StandardToolV0`: the model reads and changes the state of the UI it wrote, and calls your
 * functions, as the user would. Hand it to the model on the server; it runs in the browser through `useExprTool()`
 * from `@uicast/react`. The model reads the steps, the expressions and your functions from the core prompt blocks,
 * so add them to the system prompt as for any document.
 *
 * @example
 * const expr = exprTool();
 * streamText({ model, system, messages, tools: { [expr.name]: tool({ description: expr.description, inputSchema: expr.inputSchema }) } });
 */
export function exprTool({ note }: ExprToolOptions = {}): StandardToolV0 & {
  inputSchema: typeof exprToolInput;
  outputSchema: typeof exprToolOutput;
} {
  return {
    name: "expr",
    description: joinSections(EXPR_TOOL.replace("🔴MAX_READ🔴", String(EXPR_TOOL_MAX_READ)).trim(), noteSection(note)),
    inputSchema: exprToolInput,
    outputSchema: exprToolOutput,
    execute: () => {
      throw new Error(
        "[uicast] The expr tool runs in the browser: answer its calls with useExprTool() from @uicast/react.",
      );
    },
  };
}
