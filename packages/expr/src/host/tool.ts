import type { StandardToolV0 } from "./standard-tool";
import { ExpressionError, type ExpressionErrorReason } from "../errors";
import { assertData } from "../runtime/membrane";
import type { HostFunction } from "../runtime/values";
import { hostFunctionNameFault } from "./names";

// Nothing here is `async` — that would allocate a promise even on a synchronous return. Only a real Promise defers the next step.
const then = (value: unknown, next: (value: unknown) => unknown): unknown =>
	value instanceof Promise ? value.then(next) : next(value);

type Schema = NonNullable<StandardToolV0["inputSchema"]>;
type Validation = ReturnType<Schema["~standard"]["validate"]>;
type Settled = Awaited<Validation>;

const formatIssues = (issues: Settled["issues"]): string =>
	(issues ?? [])
		.map((issue) => {
			const at = (issue.path ?? []).map((seg) => String(typeof seg === "object" ? seg.key : seg)).join(".");
			return at ? `${at}: ${issue.message}` : issue.message;
		})
		.join("; ");

// The host's own message rides along: the error-recovery prompt shows it to the model, and "server unreachable" is what makes a failure actionable.
const hostFailure = (name: string, err: unknown): ExpressionError =>
	ExpressionError.is(err)
		? err
		: new ExpressionError(`"${name}" failed: ${err instanceof Error ? err.message : String(err)}`, "host-function", err);

// A validator's own throw, or a thenable that is not a Promise, is the host's schema misbehaving — refused as such rather than read as a verdict.
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

const bind = (tool: StandardToolV0): HostFunction => {
	const name = tool.name;
	const check = (schema: Schema | undefined, value: unknown, reason: ExpressionErrorReason, what: string): unknown =>
		schema === undefined
			? value
			: then(runSchema(schema, name, value), (result) => {
					const settled = result as Settled;
					if (settled.issues) throw new ExpressionError(`"${name}" ${what} — ${formatIssues(settled.issues)}`, reason);
					return settled.value;
				});
	const execute = (input: unknown): unknown => {
		try {
			const output = tool.execute(input);
			return output instanceof Promise
				? output.catch((err) => {
						throw hostFailure(name, err);
					})
				: output;
		} catch (err) {
			throw hostFailure(name, err);
		}
	};
	const asData = (value: unknown): unknown => {
		try {
			assertData(value, `"${name}" result`);
		} catch (err) {
			throw new ExpressionError((err as Error).message, "host-function", err);
		}
		return value;
	};
	return (input) => {
		assertData(input, `"${name}" argument`);
		return then(check(tool.inputSchema, input, "invalid-arguments", "rejected its argument"), (checked) =>
			then(execute(checked), (output) =>
				then(check(tool.outputSchema, output, "host-function", "returned a value its output schema rejects"), asData),
			),
		);
	};
};

// Bind every tool once. A bad or duplicate name is a host configuration error, thrown here.
export const bindTools = (tools: readonly StandardToolV0[]): Record<string, HostFunction> => {
	const bound: Record<string, HostFunction> = Object.create(null);
	for (const tool of tools) {
		const name = tool.name;
		const fault = hostFunctionNameFault(name);
		if (fault) throw new ExpressionError(`Host function name "${name}" ${fault}`, "host-function");
		if (bound[name] !== undefined) throw new ExpressionError(`Duplicate host function name "${name}"`, "host-function");
		bound[name] = bind(tool);
	}
	return bound;
};
