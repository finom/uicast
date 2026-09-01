import { Evaluator, ExpressionError, type EvaluatorMode } from "@uicast/expr";
import type { StandardToolV0 } from "standard-tool";
import type { ValueSource } from "../types";
import { EntryError } from "../entry-error";
import { functionNameFault } from "./function-name";

// Bind host functions and classify every failure as an EntryError; the
// language itself lives in @uicast/expr. In the default interpret mode no
// source reaches `new Function`.

const saferEval = new Evaluator();
// One instance per (mode, maxSourceLength) pair a host actually uses — each
// carries its own parse cache, so configs must not share one.
const evaluators = new Map<string, Evaluator>();
const getEvaluator = (mode: EvaluatorMode | undefined, maxExpressionLength?: number): Evaluator => {
	if (mode !== "native" && maxExpressionLength === undefined) return saferEval;
	const key = `${mode ?? "interpret"}:${maxExpressionLength ?? "default"}`;
	let ev = evaluators.get(key);
	if (ev === undefined) {
		ev = new Evaluator({
			mode: mode === "native" ? "native" : "interpret",
			maxSourceLength: maxExpressionLength,
		});
		evaluators.set(key, ev);
	}
	return ev;
};

export type { EvaluatorMode };

export const getScopeReads = (expr: string): readonly string[] =>
	saferEval.memberReads(expr, "scopes");

export const getFreeIdentifiers = (expr: string): readonly string[] =>
	saferEval.validate(expr).freeIds;

// standard-tool's input-validation failure, detected structurally: two package
// copies can coexist in one bundle, where `instanceof` silently fails.
const isToolInputValidationError = (err: unknown): boolean =>
	err instanceof Error &&
	err.name === "StandardToolValidationError" &&
	(err as { target?: unknown }).target === "input";

// Anything escaping `tool.execute` is host code failing — with two exceptions:
// the tool's input schema rejecting the arguments is the document's fault
// (it made the call), and an EntryError the host classified itself passes
// through untouched.
const wrapToolError = (err: unknown): EntryError =>
	EntryError.wrap(
		err,
		isToolInputValidationError(err) ? "invalid-arguments" : "host-function",
	);

// Classify an evaluation failure by provenance: Evaluator's own rejections
// carry their reason (syntax / policy / unknown identifier / budget); an
// EntryError passes through; anything else threw while the expression ran.
const wrapEvalError = (err: unknown): EntryError => {
	if (EntryError.is(err)) return err;
	if (err instanceof ExpressionError) {
		// Two of the evaluator's reasons have no EntryError of their own.
		// "budget-exceeded" is a document fault — the model wrote work the engine
		// will not do — so it lands on the guardrail reason the prompt already
		// explains. "runtime" is an ordinary throw inside a legal expression.
		const reason =
			err.reason === "budget-exceeded"
				? "guardrail-violation"
				: err.reason === "runtime"
					? "expression-runtime"
					: err.reason;
		return EntryError.wrap(err, reason);
	}
	return EntryError.wrap(err, "expression-runtime");
};

// One wrapper record per tools-array identity: a reactive wave evaluates
// thousands of expressions against the same array, and rebuilding N closures
// per evaluation was the dominant fixed cost.
const wrappedTools = new WeakMap<
	StandardToolV0[],
	Record<string, (input: unknown) => unknown>
>();

const wrapTools = (
	tools: StandardToolV0[],
): Record<string, (input: unknown) => unknown> => {
	const cached = wrappedTools.get(tools);
	if (cached) return cached;
	const functions: Record<string, (input: unknown) => unknown> = {};
	for (const tool of tools) {
		// A tool's name becomes a bare identifier in expressions. Screened here
		// rather than surfacing as an opaque failure the document gets blamed for.
		const fault = functionNameFault(tool.name);
		if (fault) {
			throw new EntryError(`Host function name "${tool.name}" ${fault}`, {
				reason: "host-function",
			});
		}
		functions[tool.name] = (input: unknown) => {
			try {
				const result = tool.execute(input);
				return result instanceof Promise
					? result.catch((err) => {
							throw wrapToolError(err);
						})
					: result;
			} catch (err) {
				throw wrapToolError(err);
			}
		};
	}
	wrappedTools.set(tools, functions);
	return functions;
};

/**
 * Evaluate a ValueSource: `literal` as-is, `expr` through the evaluator. An
 * async expr resolves to a Promise (callers check `instanceof Promise`);
 * `evaluator: "native"` needs `unsafe-eval` — trusted authors only.
 */
export const evaluate = (
	expr: ValueSource,
	context: Record<string, unknown>,
	options?: {
		functions?: StandardToolV0[];
		evaluator?: EvaluatorMode;
		maxExpressionLength?: number;
	},
): unknown => {
	if ("literal" in expr) return expr.literal;
	// Absent expr means "no value"; an empty string falls through to the
	// evaluator, which rejects it as a classified document fault.
	if (expr.expr == null) return null;

	const functions = options?.functions?.length ? wrapTools(options.functions) : undefined;
	const ev = getEvaluator(options?.evaluator, options?.maxExpressionLength);

	try {
		const result = ev.eval(expr.expr, context, { functions });
		return result instanceof Promise
			? result.catch((err) => {
					throw wrapEvalError(err);
				})
			: result;
	} catch (err) {
		throw wrapEvalError(err);
	}
};
