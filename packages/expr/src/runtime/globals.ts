import { CALLABLE_GLOBALS, CONSTANT_GLOBALS, NAMESPACE_GLOBALS } from "../constants/globals";
import type { Budget } from "./budget";
import { chargeResult } from "./membrane";
import { fail, Namespace, runtimeFault, table } from "./values";

// The values behind constants/globals.ts: what a bare name resolves to, and what the callable ones do.

export const GLOBAL_VALUES: Readonly<Record<string, unknown>> = Object.freeze({
	...Object.fromEntries(NAMESPACE_GLOBALS.map((name) => [name, new Namespace(name)])),
	...CONSTANT_GLOBALS,
});

// The engine's own functions, by name from the allow-list.
export const GLOBAL_FUNCTIONS: Readonly<Record<string, (...args: unknown[]) => unknown>> = table(
	Object.fromEntries([...CALLABLE_GLOBALS].map((name) => [name, (globalThis as Record<string, unknown>)[name] as (...args: unknown[]) => unknown])),
);

// `Number(x)`, `parseInt(s)`, …: one step, the result charged like a method's.
export const callGlobal = (name: string, args: unknown[], budget: Budget): unknown => {
	const fn = GLOBAL_FUNCTIONS[name];
	if (fn === undefined) return fail(`"${name}" is not callable`);
	budget.tick(1);
	try {
		return chargeResult(fn(...args), name, budget);
	} catch (err) {
		return runtimeFault(`${name}()`, err);
	}
};
