import type { ExpressionEvaluator } from "@uicast/expr";
import { EXPR_TOOL_MAX_READ } from "../constants";
import { joinSections, noteSection } from "../prompt/format";
import { functionsBlock } from "../prompt/get-functions-partial-prompt";
import EXPR_TOOL from "../prompt/md/EXPR_TOOL.json" with { type: "json" };
import EXPR_TOOL_READ from "../prompt/md/EXPR_TOOL_READ.json" with { type: "json" };
import { exprToolSchemas } from "./schemas";

type StandardToolV0 = ExpressionEvaluator["functions"][number];

/**
 * Options for `exprTool`.
 *
 * @example
 * const options: ExprToolOptions = { functions: [listCustomers, getCustomer], note: "Selection lives in scopes.root.selected." };
 */
export type ExprToolOptions = {
  /**
   * Lets a call read a value back. Off by default: the model writes state and calls functions, and no data from the UI
   * reaches it. On, whatever a call reads goes to the model's provider; give `useExprTool()` the same value.
   */
  read?: boolean;
  /**
   * The host functions this tool calls instead of the UI's, described in its own text; give `useExprTool()` the same
   * array. Absent: the tool calls the UI's functions, which the system prompt lists.
   */
  functions?: readonly StandardToolV0[];
  /** Your text, appended verbatim as a trailing `## Note`. */
  note?: string;
};

// Given functions replace the UI's for this tool, so the model reads them here, not in the system prompt.
const functionsSection = (functions: readonly StandardToolV0[], read: boolean): string =>
  functions.length
    ? functionsBlock(functions, "Functions: only these, not the ones in system prompt", "##")
    : `## Functions\n\nNone: a step${read ? " or `read`" : ""} that calls one fails.`;

/**
 * The `expr` tool, a `StandardToolV0`: the model changes the state of the UI it wrote, and calls your functions, as the
 * user would; with `read`, it also reads values back. Hand it to the model on the server; it runs in the browser
 * through `useExprTool()` from `@uicast/react`. The model reads the steps, the expressions and your functions from the
 * core prompt blocks, so add them to the system prompt as for any document.
 *
 * @example
 * const expr = exprTool({ functions: [listCustomers, getCustomer] });
 * streamText({ model, system, messages, tools: { [expr.name]: tool({ description: expr.description, inputSchema: expr.inputSchema }) } });
 */
export function exprTool({ read = false, functions, note }: ExprToolOptions = {}): StandardToolV0 & {
  inputSchema: ReturnType<typeof exprToolSchemas>["input"];
  outputSchema: ReturnType<typeof exprToolSchemas>["output"];
} {
  const { input, output } = exprToolSchemas(read);
  return {
    name: "expr",
    description: joinSections(
      (read ? EXPR_TOOL_READ : EXPR_TOOL).replace("🔴MAX_READ🔴", String(EXPR_TOOL_MAX_READ)).trim(),
      functions && functionsSection(functions, read),
      noteSection(note),
    ),
    inputSchema: input,
    outputSchema: output,
    execute: () => {
      throw new Error(
        "[uicast] The expr tool runs in the browser: answer its calls with useExprTool() from @uicast/react.",
      );
    },
  };
}
