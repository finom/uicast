import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ALLOWED_GLOBALS, ALLOWED_METHOD_NAMES } from "@uicast/expr/internal";
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

// The markdown lists no methods: the language is the standard ones, minus what the rules leave out.
describe("the advertised methods match the grammar", () => {
	it("advertises no method the grammar refuses", () => {
		const md = readFileSync(new URL("../md/EXPRESSIONS.md", import.meta.url), "utf-8");
		// Building blocks and idioms only: the rules name what the language lacks (`.forEach()`).
		const list = md.slice(md.indexOf("Building blocks:"), md.indexOf("SAFETY:"));
		const advertised = new Set([...list.matchAll(/\.([a-zA-Z]+)\(/g)].map((m) => m[1]));
		expect(advertised.size).toBeGreaterThan(10);
		for (const name of advertised) expect(ALLOWED_METHOD_NAMES, name).toContain(name);
	});
});
