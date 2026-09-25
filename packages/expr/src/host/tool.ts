import { ExpressionError, type ExpressionErrorReason, messageOf } from "../errors";
import { assertData } from "../runtime/membrane";
import type { HostFunction } from "../runtime/values";
import { hostFunctionNameFault } from "../syntax/parse";
import type { StandardToolV0 } from "./standard-tool";

// Nothing here is `async` — that would allocate a promise even on a synchronous return. Only a real Promise defers the next step.
const then = (value: unknown, next: (value: unknown) => unknown): unknown =>
  value instanceof Promise ? value.then(next) : next(value);

type Schema = NonNullable<StandardToolV0["inputSchema"]>;
type Validation = ReturnType<Schema["~standard"]["validate"]>;
type Settled = Awaited<Validation>;

const formatIssues = (issues: NonNullable<Settled["issues"]>): string =>
  issues
    .map((issue) => {
      const at = (issue.path ?? []).map((seg) => String(typeof seg === "object" ? seg.key : seg)).join(".");
      return at ? `${at}: ${issue.message}` : issue.message;
    })
    .join("; ");

// The host's own message rides along: "server unreachable" is what makes a failure actionable.
const hostFailure = (name: string, err: unknown): ExpressionError =>
  ExpressionError.is(err) ? err : new ExpressionError(`"${name}" failed: ${messageOf(err)}`, "host-function", err);

// A validator's own throw, or a thenable that is not a Promise, is the host's schema misbehaving, not a verdict.
const runSchema = (schema: Schema, name: string, value: unknown): Validation => {
  let result: Validation;
  try {
    result = schema["~standard"].validate(value);
  } catch (err) {
    throw hostFailure(name, err);
  }
  if (!(result instanceof Promise) && typeof (result as { then?: unknown }).then === "function") {
    throw new ExpressionError(`"${name}" schema returned a thenable that is not a Promise`, "host-function");
  }
  return result;
};

const checkSchema = (
  name: string,
  schema: Schema | undefined,
  value: unknown,
  reason: ExpressionErrorReason,
  what: string,
): unknown =>
  schema === undefined
    ? value
    : then(runSchema(schema, name, value), (result) => {
        const settled = result as Settled;
        if (settled.issues) throw new ExpressionError(`"${name}" ${what} — ${formatIssues(settled.issues)}`, reason);
        return settled.value;
      });

const execute = (tool: StandardToolV0, input: unknown): unknown => {
  try {
    const output = tool.execute(input);
    return output instanceof Promise
      ? output.catch((err) => {
          throw hostFailure(tool.name, err);
        })
      : output;
  } catch (err) {
    throw hostFailure(tool.name, err);
  }
};

const asData = (name: string, value: unknown): unknown => {
  try {
    assertData(value, `"${name}" result`);
  } catch (err) {
    throw new ExpressionError(messageOf(err), "host-function", err);
  }
  return value;
};

// The data gate and the tool's own schemas on both sides of `execute`.
export const callTool = (tool: StandardToolV0, input: unknown): unknown => {
  const name = tool.name;
  assertData(input, `"${name}" argument`);
  return then(checkSchema(name, tool.inputSchema, input, "invalid-arguments", "rejected its argument"), (checked) =>
    then(execute(tool, checked), (output) =>
      then(
        checkSchema(name, tool.outputSchema, output, "host-function", "returned a value its output schema rejects"),
        (value) => asData(name, value),
      ),
    ),
  );
};

// A bad or duplicate name is a host configuration error.
export const bindTools = (
  tools: readonly StandardToolV0[],
  call: (tool: StandardToolV0, input: unknown) => unknown,
): Record<string, HostFunction> => {
  const bound: Record<string, HostFunction> = Object.create(null);
  for (const tool of tools) {
    const name = tool.name;
    const fault = hostFunctionNameFault(name);
    if (fault) throw new ExpressionError(`Host function name "${name}" ${fault}`, "host-function");
    if (bound[name] !== undefined) throw new ExpressionError(`Duplicate host function name "${name}"`, "host-function");
    bound[name] = (input) => call(tool, input);
  }
  return bound;
};
