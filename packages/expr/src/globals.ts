import type { Budget } from "./budget";
import { ExpressionError } from "./errors";
import { Namespace } from "./membrane";

// The names an expression can see when nothing else defines them. There is no
// ambient scope: a name that is neither a context key nor listed here does not
// resolve at all — `fetch` is absent, not blocked.

/** Values reachable by bare name. Namespaces route through the membrane. */
export const GLOBAL_VALUES: Readonly<Record<string, unknown>> = Object.freeze({
	// Namespaces with method tables
	Math: new Namespace("Math"),
	JSON: new Namespace("JSON"),
	Object: new Namespace("Object"),
	Array: new Namespace("Array"),
	Intl: new Namespace("Intl"),
	// Both callable and namespaces
	Number: new Namespace("Number"),
	String: new Namespace("String"),
	Boolean: new Namespace("Boolean"),
	Date: new Namespace("Date"),
	// Constructors only
	Map: new Namespace("Map"),
	Set: new Namespace("Set"),
	URL: new Namespace("URL"),
	// Bare functions
	parseInt: new Namespace("parseInt"),
	parseFloat: new Namespace("parseFloat"),
	isNaN: new Namespace("isNaN"),
	isFinite: new Namespace("isFinite"),
	encodeURIComponent: new Namespace("encodeURIComponent"),
	decodeURIComponent: new Namespace("decodeURIComponent"),
	// Constants
	undefined: undefined,
	NaN: Number.NaN,
	Infinity: Number.POSITIVE_INFINITY,
});

/** Every name {@link GLOBAL_VALUES} defines — what the prompt advertises. */
export const ALLOWED_GLOBALS: readonly string[] = Object.freeze(
	Object.keys(GLOBAL_VALUES),
);

const num = (v: unknown): number => (typeof v === "number" ? v : Number(v));

/**
 * Namespaces that are also functions (`Number(x)`, `parseInt(s)`). Called only
 * when the callee is a bare identifier, never when it is a member expression.
 */
export const CALLABLE_GLOBALS: Readonly<
	Record<string, (args: unknown[], budget: Budget) => unknown>
> = Object.freeze({
	Number: (a, b) => {
		b.tick(1);
		return Number(a[0]);
	},
	String: (a, b) => {
		const out = a[0] === undefined && a.length === 0 ? "" : String(a[0]);
		b.string(out.length);
		return out;
	},
	Boolean: (a, b) => {
		b.tick(1);
		return Boolean(a[0]);
	},
	parseInt: (a, b) => {
		b.tick(1);
		return Number.parseInt(String(a[0]), a[1] === undefined ? undefined : num(a[1]));
	},
	parseFloat: (a, b) => {
		b.tick(1);
		return Number.parseFloat(String(a[0]));
	},
	isNaN: (a, b) => {
		b.tick(1);
		return Number.isNaN(Number(a[0]));
	},
	isFinite: (a, b) => {
		b.tick(1);
		return Number.isFinite(Number(a[0]));
	},
	encodeURIComponent: (a, b) => {
		const s = String(a[0]);
		b.string(s.length * 3);
		return encodeURIComponent(s);
	},
	decodeURIComponent: (a, b) => {
		const s = String(a[0]);
		b.string(s.length);
		try {
			return decodeURIComponent(s);
		} catch {
			throw new ExpressionError("decodeURIComponent received a malformed sequence");
		}
	},
});
