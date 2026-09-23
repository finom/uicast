import { CALLABLE_GLOBALS, CONSTANT_GLOBALS, NAMESPACE_GLOBALS } from "../constants/globals";
import { PRICES } from "../constants/limits";
import type { Budget } from "./budget";
import { chargeNumber } from "./coerce";
import { chargeResult } from "./membrane";
import { fail, Namespace, runtimeFault, table } from "./values";

export const GLOBAL_VALUES: Readonly<Record<string, unknown>> = Object.freeze({
	...Object.fromEntries(NAMESPACE_GLOBALS.map((name) => [name, new Namespace(name)])),
	...CONSTANT_GLOBALS,
});

export const GLOBAL_FUNCTIONS: Readonly<Record<string, (...args: unknown[]) => unknown>> = table(
	Object.fromEntries([...CALLABLE_GLOBALS].map((name) => [name, (globalThis as Record<string, unknown>)[name] as (...args: unknown[]) => unknown])),
);

// These rewrite their text one character at a time, several per step for most, one for CJK.
const URI_FUNCTIONS: ReadonlySet<string> = new Set(["encodeURIComponent", "decodeURIComponent"]);

export const callGlobal = (name: string, args: unknown[], budget: Budget): unknown => {
	const fn = GLOBAL_FUNCTIONS[name];
	if (fn === undefined) return fail(`"${name}" is not callable`);
	budget.tick(PRICES.call);
	for (const arg of args) chargeNumber(arg, budget);
	if (URI_FUNCTIONS.has(name)) budget.tick(String(args[0]).length);
	try {
		return chargeResult(fn(...args), name, budget);
	} catch (err) {
		return runtimeFault(`${name}()`, err);
	}
};
