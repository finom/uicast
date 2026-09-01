import {
	Evaluator,
	ExpressionError,
	type EvaluatorMode,
	type ExpressionErrorReason,
} from "@uicast/expr";
import type { StandardToolV0 } from "standard-tool";
import type { ValueSource } from "../types";
import { EntryError, type EntryErrorReason } from "../entry-error";
import { functionNameFault } from "./function-name";

// Pick the evaluator a call runs on and classify every failure as an
// EntryError; the language, and the host-function boundary it guards, live in
// @uicast/expr. In the default interpret mode no source reaches `new Function`.

const configKey = (mode: EvaluatorMode | undefined, maxLen: number | undefined): string =>
	`${mode ?? "interpret"}:${maxLen ?? "default"}`;

// The tool-free instances. The default-config one is also the analysis
// instance below, so a host with no functions parses each expression once.
const toolFree = new Map<string, Evaluator>();
const analysisEval = new Evaluator();
toolFree.set(configKey(undefined, undefined), analysisEval);

// One config map per tools-array identity. Host functions bind at construction
// now, so the array picks the evaluator instead of being wrapped per call — and
// a WeakMap lets a retired provider's evaluators, and their parse caches, go
// with it.
const byTools = new WeakMap<readonly StandardToolV0[], Map<string, Evaluator>>();

// uicast's layer on the language's own screen — a name that would shadow
// `scopes`/`evt` or a global takes precedence silently, so refuse it here.
const screenToolNames = (tools: readonly StandardToolV0[]): void => {
	const seen = new Set<string>();
	for (const { name } of tools) {
		const fault = functionNameFault(name);
		if (fault) {
			throw new EntryError(`Host function name "${name}" ${fault}`, {
				reason: "host-function",
			});
		}
		if (seen.has(name)) {
			throw new EntryError(`Duplicate host function name "${name}"`, {
				reason: "host-function",
			});
		}
		seen.add(name);
	}
};

const getEvaluator = (
	tools: readonly StandardToolV0[] | undefined,
	mode: EvaluatorMode | undefined,
	maxLen: number | undefined,
): Evaluator => {
	let perConfig: Map<string, Evaluator>;
	if (tools === undefined) perConfig = toolFree;
	else {
		const existing = byTools.get(tools);
		if (existing) perConfig = existing;
		else {
			// Screened before anything is cached, so a bad name throws on every
			// call rather than only the first.
			screenToolNames(tools);
			perConfig = new Map();
			byTools.set(tools, perConfig);
		}
	}
	const key = configKey(mode, maxLen);
	let ev = perConfig.get(key);
	if (ev === undefined) {
		ev = new Evaluator({
			mode: mode === "native" ? "native" : "interpret",
			maxSourceLength: maxLen,
			functions: tools,
		});
		perConfig.set(key, ev);
	}
	return ev;
};

export type { EvaluatorMode };

export const getScopeReads = (expr: string): readonly string[] =>
	analysisEval.memberReads(expr, "scopes");

export const getFreeIdentifiers = (expr: string): readonly string[] =>
	analysisEval.validate(expr).freeIds;

// Total, so a reason added in @uicast/expr fails this build rather than arriving
// unmapped. The last two have no EntryError of their own: a budget refusal is
// still the document asking for too much, and "runtime" is a legal expression
// throwing.
const REASON_BY_EXPRESSION_REASON: Record<ExpressionErrorReason, EntryErrorReason> = {
	"expression-syntax": "expression-syntax",
	"guardrail-violation": "guardrail-violation",
	"unknown-reference": "unknown-reference",
	"invalid-arguments": "invalid-arguments",
	"host-function": "host-function",
	"budget-exceeded": "guardrail-violation",
	runtime: "expression-runtime",
};

// Classify by provenance: the Evaluator's own rejections carry their reason, an
// EntryError passes through, and anything else threw while the expression ran.
const wrapEvalError = (err: unknown): EntryError => {
	if (EntryError.is(err)) return err;
	if (ExpressionError.is(err)) {
		// A host function's throw arrives wrapped, the original on `cause` — a
		// host that classified its own failure keeps that verdict.
		if (EntryError.is(err.cause)) return err.cause;
		return EntryError.wrap(err, REASON_BY_EXPRESSION_REASON[err.reason] ?? "expression-runtime");
	}
	return EntryError.wrap(err, "expression-runtime");
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

	// An empty array is no functions at all — keying on its identity would mint
	// an evaluator, and a cold parse cache, per allocation.
	const functions = options?.functions?.length ? options.functions : undefined;

	try {
		const ev = getEvaluator(functions, options?.evaluator, options?.maxExpressionLength);
		const result = ev.eval(expr.expr, context);
		return result instanceof Promise
			? result.catch((err) => {
					throw wrapEvalError(err);
				})
			: result;
	} catch (err) {
		throw wrapEvalError(err);
	}
};
