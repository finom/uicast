import { ALLOWED_GLOBALS, hostFunctionNameFault } from "@uicast/expr/internal";
import { CONTEXT_NAMES } from "../constants";

const GLOBALS = new Set(ALLOWED_GLOBALS);

// The message tail, or null when the name is usable.
export const functionNameFault = (name: string): string | null => {
	const fault = hostFunctionNameFault(name);
	if (fault !== null) return fault;
	if (CONTEXT_NAMES.has(name)) return "is reserved — it would shadow the expression context of the same name";
	if (GLOBALS.has(name)) return "is an expression global — the function would shadow it; rename it";
	return null;
};
