import { ALLOWED_GLOBALS } from "@uicast/expr";
import { isUsableName } from "@uicast/expr/internal";

// The language screen lives in @uicast/expr; this adds uicast's layer on top.
// Lookup precedence is functions > context > globals, so a colliding name
// would silently shadow instead of failing.
const CONTEXT_NAMES = new Set(["scopes", "evt", "currentValue"]);
const GLOBALS = new Set(ALLOWED_GLOBALS);

/** Why `name` cannot be a host function name (message tail), or null when it can. */
export const functionNameFault = (name: string): string | null =>
	!isUsableName(name)
		? "is not a valid identifier — rename it (letters, digits, _ and $, not starting with a digit, not a reserved word)"
		: CONTEXT_NAMES.has(name)
			? "is reserved — it would shadow the expression context of the same name"
			: GLOBALS.has(name)
				? "is an expression global — the function would shadow it; rename it"
				: null;
