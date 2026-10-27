import { z } from "zod";
import { type EntryErrorReason, REASON_DESCRIPTIONS } from "../entry-error";

const target = {
  set: z.string().optional().describe("scopes.root.<field> to write; absent: the step runs for its effect"),
  confirm: z.string().optional().describe("Question the user confirms before this step runs"),
};

// A callback step: `expr` or `literal`, as `ValueSource` has it.
const step = z.union([
  z.strictObject({ ...target, expr: z.string().describe("Expression; its value is written to `set`") }),
  z.strictObject({ ...target, literal: z.unknown().describe("JSON value written to `set`, instead of `expr`") }),
]);

export const exprToolInput = z
  .strictObject({
    steps: z.array(step).optional().describe("Callback steps, run in order"),
    read: z.string().optional().describe("Expression whose value comes back, read after the steps"),
  })
  .refine(({ steps, read }) => steps !== undefined || read !== undefined, 'Give "steps", "read" or both.');

const reasons = Object.keys(REASON_DESCRIPTIONS) as [EntryErrorReason, ...EntryErrorReason[]];

export const exprToolOutput = z.union([
  z.strictObject({ value: z.unknown().optional() }),
  z.strictObject({ declined: z.literal(true) }),
  z.strictObject({ error: z.strictObject({ reason: z.enum(reasons), message: z.string() }) }),
]);

/**
 * What the model sends to the `expr` tool: steps to run, an expression to read back, or both.
 *
 * @example
 * const input: ExprToolInput = { steps: [{ set: "scopes.root.selected", literal: { "7": true } }] };
 */
export type ExprToolInput = z.infer<typeof exprToolInput>;

/**
 * What the `expr` tool answers: the value of `read`, `declined` when the user declined a `confirm`, or the classified
 * error of the step or read that failed.
 *
 * @example
 * const output: ExprToolOutput = { error: { reason: "unknown-reference", message: "…" } };
 */
export type ExprToolOutput = z.infer<typeof exprToolOutput>;
