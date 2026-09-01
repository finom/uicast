import { ALLOWED_GLOBALS } from "@uicast/expr";
import { hostFunctionNameFault } from "@uicast/expr/internal";

// The language screen lives in @uicast/expr — the same predicate its Evaluator
// constructor runs — and this adds uicast's layer on top. Because core's check
// is expr's with terms appended, a name the prompt advertises is a name the
// evaluator accepts. Lookup precedence is functions > context > globals, so a
// colliding name would silently shadow instead of failing.
const CONTEXT_NAMES = new Set(["scopes", "evt", "currentValue"]);
const GLOBALS = new Set(ALLOWED_GLOBALS);

/** Why `name` cannot be a host function name (message tail), or null when it can. */
export const functionNameFault = (name: string): string | null =>
	hostFunctionNameFault(name) ??
	(CONTEXT_NAMES.has(name)
		? "is reserved — it would shadow the expression context of the same name"
		: GLOBALS.has(name)
			? "is an expression global — the function would shadow it; rename it"
			: null);
