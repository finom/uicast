import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ALLOWED_GLOBALS } from "@uicast/expr";
import { ALLOWED_METHOD_NAMES, NAMESPACE_METHOD_NAMES } from "@uicast/expr/internal";
import { getExpressionsPartialPrompt } from "../get-expressions-partial-prompt";

describe("getExpressionsPartialPrompt", () => {
	it("fills the globals slot from ALLOWED_GLOBALS", () => {
		const prompt = getExpressionsPartialPrompt();
		expect(prompt).not.toContain("🔴ALLOWED_GLOBALS🔴");
		for (const name of ALLOWED_GLOBALS) expect(prompt).toContain(name);
	});

	it("describes the language and nothing about a host's context", () => {
		const prompt = getExpressionsPartialPrompt();
		expect(prompt).toContain("# JavaScript Expressions");
		expect(prompt).toContain("No statements");
		// `scopes` / `evt` / `currentValue` are uicast's, not the language's.
		expect(prompt).not.toContain("currentValue");
	});

	it("fills the length slot from the evaluator's default, or the host's value", () => {
		const prompt = getExpressionsPartialPrompt();
		expect(prompt).not.toContain("🔴MAX_LENGTH🔴");
		expect(prompt).toContain("at most 1000 characters");
		expect(getExpressionsPartialPrompt({ maxLength: 250 })).toContain("at most 250 characters");
	});

	it("renders note as a trailing ## Note section", () => {
		const prompt = getExpressionsPartialPrompt({ note: "Dates are ISO strings." });
		expect(prompt.endsWith("## Note\n\nDates are ISO strings.")).toBe(true);
		expect(getExpressionsPartialPrompt()).not.toContain("## Note");
	});
});

// The language description lives here, the grammar tables live in
// @uicast/expr. Advertising a method the evaluator would refuse is the drift
// this guards — a shipped document written against the prompt would fail at
// render. The reverse gap is deliberate: the markdown abbreviates ("and the
// trigonometry set"), so the grammar allows more names than it spells out.
describe("the advertised method list matches the grammar", () => {
	it("advertises no method the grammar refuses", () => {
		const md = readFileSync(new URL("../md/EXPRESSIONS.md", import.meta.url), "utf-8");
		const allowed = new Set<string>([
			...ALLOWED_METHOD_NAMES,
			...Object.values(NAMESPACE_METHOD_NAMES).flatMap((set) => [...set]),
		]);
		// The method-list section only: prose elsewhere names methods the language
		// deliberately lacks (`Math.random`), which is not drift. Calls only —
		// `.length` and `.size` are properties, checked by the membrane, not here.
		const list = md.slice(md.indexOf("These are the available methods"));
		const advertised = new Set(
			[...list.matchAll(/`(?:[A-Za-z]+)?\.([a-zA-Z]+)\([^)]*\)`/g)].map((m) => m[1]),
		);
		expect(advertised.size).toBeGreaterThan(50);
		for (const name of advertised) expect(allowed, name).toContain(name);
	});
});
