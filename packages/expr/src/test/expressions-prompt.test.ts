import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ALLOWED_GLOBALS } from "../index";
import { getExpressionsPartialPrompt } from "../prompt";

describe("EXPRESSIONS.json mirror", () => {
	// The .md ships through a generated .json mirror; nothing else fails loudly
	// when it goes stale.
	it("matches its .md source", () => {
		const md = readFileSync(new URL("../prompt/EXPRESSIONS.md", import.meta.url), "utf-8");
		const json = readFileSync(new URL("../prompt/EXPRESSIONS.json", import.meta.url), "utf-8");
		expect(
			JSON.parse(json),
			"EXPRESSIONS.json is stale — run `npm run md-to-json` and commit both files",
		).toBe(md);
	});
});

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

	it("appends host globals, deduplicated against the built-ins", () => {
		const prompt = getExpressionsPartialPrompt({ allowGlobals: ["structuredClone", "crypto"] });
		expect(prompt).toContain("structuredClone, crypto");
		expect(getExpressionsPartialPrompt({ allowGlobals: ["Math"] }).split("Math").length).toBe(
			getExpressionsPartialPrompt().split("Math").length,
		);
	});

	it("renders note as a trailing ## Note section", () => {
		const prompt = getExpressionsPartialPrompt({ note: "Dates are ISO strings." });
		expect(prompt.endsWith("## Note\n\nDates are ISO strings.")).toBe(true);
		expect(getExpressionsPartialPrompt()).not.toContain("## Note");
	});
});
