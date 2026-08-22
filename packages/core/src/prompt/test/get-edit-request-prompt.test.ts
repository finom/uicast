import { describe, expect, it } from "vitest";
import { getEditRequestPrompt } from "../get-edit-request-prompt";

describe("getEditRequestPrompt", () => {
	it("leads with the request and appends the delta convention", () => {
		const out = getEditRequestPrompt({
			request: "Add pagination to the orders table.",
		});
		expect(out.startsWith("Add pagination to the orders table.")).toBe(true);
		expect(out).toContain("Emit ONLY the elements that change");
		expect(out).toContain("Never re-emit the whole page");
		expect(out).not.toContain("never emitted");
	});

	it("lists referenced-but-never-emitted keys when provided", () => {
		const out = getEditRequestPrompt({
			request: "Fix the row menu.",
			missingKeys: ["mi-paid", "mi-shipped"],
		});
		expect(out).toContain("never emitted");
		expect(out).toContain("mi-paid, mi-shipped");
		expect(out).toContain("do NOT exist");
	});
});
