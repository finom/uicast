import { ALLOWED_GLOBALS, CALLABLE_GLOBALS, CALLBACK_GLOBALS, CONSTANT_GLOBALS, NAMESPACE_GLOBALS } from "../constants/globals";
import { PRICES } from "../constants/limits";
import { CALLBACK_ARGUMENT } from "../constants/methods";
import type { Budget } from "./budget";
import { chargeNumber } from "./coerce";
import { chargeResult } from "./membrane";
import { fail, Lambda, Namespace, runtimeFault, table } from "./values";

export const GLOBAL_VALUES: Readonly<Record<string, unknown>> = Object.freeze({
	...Object.fromEntries(NAMESPACE_GLOBALS.map((name) => [name, new Namespace(name)])),
	...CONSTANT_GLOBALS,
});

// The same names as the engine's own objects, for an expression the engine runs.
export const PLATFORM_GLOBALS: Readonly<Record<string, unknown>> = Object.freeze(
	Object.fromEntries(ALLOWED_GLOBALS.map((name) => [name, (globalThis as Record<string, unknown>)[name]])),
);

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

// A global from CALLBACK_GLOBALS where a method takes its callback is called with the item alone.
export const withGlobalCallback = (key: unknown, args: unknown[], budget: Budget): unknown[] => {
	const index = typeof key === "string" ? CALLBACK_ARGUMENT[key] : undefined;
	if (index === undefined) return args;
	const f = args[index];
	if (f instanceof Namespace && CALLBACK_GLOBALS.has(f.name)) args[index] = new Lambda((item) => callGlobal(f.name, [item], budget));
	return args;
};
