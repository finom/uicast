import { describe, expect, it } from "vitest";
import { getCommonInstructionsPartialPrompt } from "../get-common-instructions-partial-prompt";

describe("getCommonInstructionsPartialPrompt", () => {
	it("ends with the # Expression Context section", () => {
		const out = getCommonInstructionsPartialPrompt();
		expect(out).toContain("# Expression Context");
		expect(out).toContain("`currentValue`");
		// The context refers to the language and function sections by heading, so
		// assembly order cannot break the references.
		expect(out).toContain("**JavaScript Expressions**");
		expect(out).toContain("**Available Functions**");
	});

	it("renders note as a trailing ## Note section", () => {
		const out = getCommonInstructionsPartialPrompt({
			note: "scopes.user holds the signed-in user: name (string).",
		});
		expect(
			out.endsWith("## Note\n\nscopes.user holds the signed-in user: name (string)."),
		).toBe(true);
		expect(getCommonInstructionsPartialPrompt()).not.toContain("## Note");
	});

	it("fills the list-cap slot, default 100", () => {
		const out = getCommonInstructionsPartialPrompt();
		expect(out).not.toContain("🔴MAX_LIST_ITEMS🔴");
		expect(out).toContain("slice(0, 100)");
		expect(getCommonInstructionsPartialPrompt({ maxListItems: 300 })).toContain("slice(0, 300)");
	});
});
