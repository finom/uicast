import { describe, expect, it } from "vitest";
import { getFencePartialPrompt } from "../get-fence-partial-prompt";

describe("getFencePartialPrompt", () => {
	it("opens with the # Emitting UI heading", () => {
		expect(getFencePartialPrompt().startsWith("# Emitting UI")).toBe(true);
	});

	it("shows the fence with the uifired language token", () => {
		const out = getFencePartialPrompt();
		expect(out).toContain("```uifired\n");
		expect(out).toContain("one JSON object per line");
	});

	it("forbids other fence languages for entries", () => {
		expect(getFencePartialPrompt()).toContain("any other fence language");
	});
});
