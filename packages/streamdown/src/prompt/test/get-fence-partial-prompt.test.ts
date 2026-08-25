import { describe, expect, it } from "vitest";
import { getFencePartialPrompt } from "../get-fence-partial-prompt";

describe("getFencePartialPrompt", () => {
	it("opens with the # Emitting UI heading", () => {
		expect(getFencePartialPrompt().startsWith("# Emitting UI")).toBe(true);
	});

	it("shows the fence with the uicast language token", () => {
		const out = getFencePartialPrompt();
		expect(out).toContain("```uicast\n");
		expect(out).toContain("one JSON object per line");
	});

	it("forbids other fence languages for entries", () => {
		expect(getFencePartialPrompt()).toContain("any other fence language");
	});

	it("explicitly supersedes the core raw-JSONL output rule", () => {
		expect(getFencePartialPrompt()).toContain("REPLACES the raw-JSONL output rule");
	});

	it("teaches that cross-reply corrections need a complete new fence", () => {
		const out = getFencePartialPrompt();
		expect(out).toContain("only works WITHIN one fence");
		expect(out).toContain("complete corrected UI");
	});

	it("teaches the single-app shared root scope", () => {
		const out = getFencePartialPrompt();
		expect(out).toContain("ONE app with ONE live `root` scope");
		expect(out).toContain("reuse an existing path for the same data");
		expect(out).toContain("first writer wins");
	});

	it("mandates self-contained seeding per block", () => {
		const out = getFencePartialPrompt();
		expect(out).toContain("MUST seed every path it reads");
		expect(out).toContain("standalone page");
	});
});
