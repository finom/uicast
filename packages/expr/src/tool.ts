import type { StandardToolV0 } from "standard-tool";
import { ExpressionError } from "./errors";
import { hostFunctionNameFault } from "./internal";
import { HostFn } from "./membrane";

// Host functions bound once, at construction, and validated against their own
// schemas on every call. Nothing here is `async` — that would allocate a promise
// even on a synchronous return; each step branches on `instanceof Promise`.

type Schema = NonNullable<StandardToolV0["inputSchema"]>;
type Validation = ReturnType<Schema["~standard"]["validate"]>;
type Settled = Awaited<Validation>;

const describe = (issues: Settled["issues"]): string =>
	(issues ?? [])
		.map((issue) => {
			const at = (issue.path ?? [])
				.map((seg) => String(typeof seg === "object" ? seg.key : seg))
				.join(".");
			return at ? `${at}: ${issue.message}` : issue.message;
		})
		.join("; ");

const takeInput = (name: string, result: Settled): unknown => {
	if (result.issues) {
		throw new ExpressionError(
			`"${name}" rejected its argument — ${describe(result.issues)}`,
			"invalid-arguments",
		);
	}
	return result.value;
};

const takeOutput = (name: string, result: Settled): unknown => {
	if (result.issues) {
		throw new ExpressionError(
			`"${name}" returned a value its output schema rejects — ${describe(result.issues)}`,
			"host-function",
		);
	}
	return result.value;
};

// The host's own message rides along: the error-recovery prompt shows it to the
// model, and "server unreachable" is what makes a failure actionable.
const hostFailure = (name: string, err: unknown): ExpressionError =>
	ExpressionError.is(err)
		? err
		: new ExpressionError(
				`"${name}" failed: ${err instanceof Error ? err.message : String(err)}`,
				"host-function",
				err,
			);

const checkOutput = (tool: StandardToolV0, name: string, value: unknown): unknown => {
	const schema = tool.outputSchema;
	if (schema === undefined) return value;
	const result = schema["~standard"].validate(value);
	return result instanceof Promise
		? result.then((settled) => takeOutput(name, settled))
		: takeOutput(name, result);
};

const run = (tool: StandardToolV0, name: string, input: unknown): unknown => {
	let output: unknown;
	// Only `execute` is guarded: a throw from checkOutput is already classified.
	try {
		output = tool.execute(input);
	} catch (err) {
		throw hostFailure(name, err);
	}
	return output instanceof Promise
		? output.then(
				(value) => checkOutput(tool, name, value),
				(err) => {
					throw hostFailure(name, err);
				},
			)
		: checkOutput(tool, name, output);
};

const bind = (tool: StandardToolV0): HostFn => {
	const name = tool.name;
	return new HostFn(name, (input: unknown): unknown => {
		const schema = tool.inputSchema;
		if (schema === undefined) return run(tool, name, input);
		const result = schema["~standard"].validate(input);
		return result instanceof Promise
			? result.then((settled) => run(tool, name, takeInput(name, settled)))
			: run(tool, name, takeInput(name, result));
	});
};

/**
 * Bind every tool, once. Throws on a name an expression could not call, or on a
 * duplicate — both are host configuration errors, not document faults.
 */
export const bindTools = (
	tools: readonly StandardToolV0[],
): Record<string, HostFn> => {
	const bound: Record<string, HostFn> = Object.create(null);
	for (const tool of tools) {
		const name = tool.name;
		const fault = hostFunctionNameFault(name);
		if (fault) {
			throw new ExpressionError(`Host function name "${name}" ${fault}`, "host-function");
		}
		if (bound[name] !== undefined) {
			throw new ExpressionError(`Duplicate host function name "${name}"`, "host-function");
		}
		bound[name] = bind(tool);
	}
	return bound;
};
