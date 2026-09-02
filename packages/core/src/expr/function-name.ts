import { ALLOWED_GLOBALS } from "@uicast/expr";
import { hostFunctionNameFault } from "@uicast/expr/internal";

import { CONTEXT_NAMES } from "./context-names";

// The prompt's screen: the language's identifier rule plus uicast's own names — the context names and the expression globals a host function would shadow.
const GLOBALS = new Set(ALLOWED_GLOBALS);

// Why `name` cannot be a host function name (message tail), or null when it can.
export const functionNameFault = (name: string): string | null =>
	hostFunctionNameFault(name) ??
	(CONTEXT_NAMES.has(name)
		? "is reserved — it would shadow the expression context of the same name"
		: GLOBALS.has(name)
			? "is an expression global — the function would shadow it; rename it"
			: null);
