import { describe, expect, it } from "vitest";
import { ALLOWED_GLOBALS } from "../../expr/globals";
import { getExpressionsPartialPrompt } from "../get-expressions-partial-prompt";

describe("getExpressionsPartialPrompt", () => {
	it("fills the globals slot from the evaluator's own list", () => {
		const prompt = getExpressionsPartialPrompt();
		expect(prompt).not.toContain("🔴ALLOWED_GLOBALS🔴");
		for (const name of ALLOWED_GLOBALS) expect(prompt).toContain(name);
	});

	// The prop widens the evaluator; this widens what the model is told. A global
	// in only one of the two is unusable — unreachable, or rejected at runtime.
	it("appends allowGlobals, so the printed list matches the provider prop", () => {
		const prompt = getExpressionsPartialPrompt({
			allowGlobals: ["structuredClone", "crypto"],
		});
		expect(prompt).toContain("structuredClone, crypto");
	});

	it("does not print a built-in twice when it is listed again", () => {
		const prompt = getExpressionsPartialPrompt({ allowGlobals: ["Math"] });
		expect(prompt.split("Math").length - 1).toBe(
			getExpressionsPartialPrompt().split("Math").length - 1,
		);
	});

	it("is unchanged when allowGlobals is empty or omitted", () => {
		expect(getExpressionsPartialPrompt({ allowGlobals: [] })).toBe(
			getExpressionsPartialPrompt(),
		);
	});

	// Mirrors <RendererProvider scopes>: a host scope the model was never told
	// about is unreachable, and the "invent no other scope" rule would
	// contradict the host's own setup.
	it("lists extraScopes next to root and the `as` scopes", () => {
		const prompt = getExpressionsPartialPrompt({
			extraScopes: [{ name: "user", description: "the signed-in user" }],
		});
		expect(prompt).not.toContain("🔴EXTRA_SCOPES🔴");
		expect(prompt).toContain(
			"plus these host-provided scopes: `scopes.user` (the signed-in user)",
		);
	});

	it("keeps $-patterns in descriptions literal", () => {
		// String.replace substitution patterns ($', $&, $`) in host-written text
		// must not splice the document or re-inject the slot marker.
		const prompt = getExpressionsPartialPrompt({
			extraScopes: [{ name: "budget", description: "USD$'000 figures $& $$" }],
		});
		expect(prompt).toContain("USD$'000 figures $& $$");
		expect(prompt).not.toContain("🔴");
	});

	it("leaves no slot residue when extraScopes is omitted", () => {
		const prompt = getExpressionsPartialPrompt();
		expect(prompt).not.toContain("🔴EXTRA_SCOPES🔴");
		expect(prompt).not.toContain("host-provided scopes");
	});
});
