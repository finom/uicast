import { describe, expect, it } from "vitest";
import { ALLOWED_GLOBALS, CALLABLE_GLOBALS, NAMESPACE_GLOBALS } from "../constants/globals";
import { ALLOWED_BINARY, ALLOWED_UNARY } from "../constants/grammar";
import { BINARY_FNS, UNARY_FNS } from "../interpret/compile";
import { METHOD_NAMES, NAMESPACE_METHOD_NAMES } from "../constants/methods";
import { GLOBAL_FUNCTIONS, GLOBAL_VALUES } from "../runtime/globals";
import { methodsOf } from "../runtime/methods";
import { Namespace } from "../runtime/values";

const sorted = (names: Iterable<string>) => [...names].sort();

describe("constants and runtime tables agree", () => {
	it("every receiver's method table", () => {
		const samples: Record<string, unknown> = {
			array: [],
			string: "",
			number: 1,
		};
		expect(sorted(Object.keys(samples))).toEqual(sorted(Object.keys(METHOD_NAMES)));
		for (const [kind, sample] of Object.entries(samples)) {
			expect(sorted(Object.keys(methodsOf(sample) ?? {})), kind).toEqual(sorted(METHOD_NAMES[kind]));
		}
	});

	it("every namespace's method table", () => {
		for (const [ns, names] of Object.entries(NAMESPACE_METHOD_NAMES)) {
			expect(sorted(Object.keys(methodsOf(new Namespace(ns)) ?? {})), ns).toEqual(sorted(names));
		}
		for (const ns of NAMESPACE_GLOBALS) {
			if (!(ns in NAMESPACE_METHOD_NAMES)) expect(methodsOf(new Namespace(ns)), ns).toBeUndefined();
		}
	});

	it("the operator tables", () => {
		expect(sorted(Object.keys(UNARY_FNS))).toEqual(sorted(ALLOWED_UNARY));
		expect(sorted(Object.keys(BINARY_FNS))).toEqual(sorted(ALLOWED_BINARY));
	});

	it("the globals and the callable ones", () => {
		expect(sorted(Object.keys(GLOBAL_VALUES))).toEqual(sorted(ALLOWED_GLOBALS));
		expect(sorted(Object.keys(GLOBAL_FUNCTIONS))).toEqual(sorted(CALLABLE_GLOBALS));
		for (const name of ALLOWED_GLOBALS) {
			expect(name in globalThis, `${name} is not a real global`).toBe(true);
		}
	});
});
