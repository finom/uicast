import { describe, expect, it } from "vitest";
import { getScopePartialPrompt } from "../get-scope-partial-prompt";

// The scope partial is the host's ambition dial: the same engine serves a
// page builder, an embeddable widget, and a chat that answers with UI. Each
// kind must render its own guidance; the size anchor and host note are
// opt-in extras.

describe("getScopePartialPrompt", () => {
	it("renders a # Scope section for each kind", () => {
		const page = getScopePartialPrompt({ kind: "page" });
		expect(page).toMatch(/^# Scope\n\n/);
		expect(page).toContain("complete, functional page");

		const widget = getScopePartialPrompt({ kind: "widget" });
		expect(widget).toMatch(/^# Scope\n\n/);
		expect(widget).toContain("single, self-contained widget");

		const answer = getScopePartialPrompt({ kind: "answer" });
		expect(answer).toMatch(/^# Scope\n\n/);
		expect(answer).toContain("answering a question inside a conversation");
	});

	it("omits the size anchor and note by default", () => {
		const out = getScopePartialPrompt({ kind: "page" });
		expect(out).not.toContain("elements (JSONL lines)");
		expect(out).not.toContain("not a quota");
	});

	it("renders approxElements as a hint, not a quota", () => {
		const out = getScopePartialPrompt({ kind: "answer", approxElements: 10 });
		expect(out).toContain(
			"around 10 elements (JSONL lines) — treat this as a hint about ambition, not a quota",
		);
	});

	it("appends the host note verbatim as the last paragraph", () => {
		const out = getScopePartialPrompt({
			kind: "widget",
			note: "The widget renders inside a 400px sidebar.",
		});
		expect(out.endsWith("The widget renders inside a 400px sidebar.")).toBe(
			true,
		);
	});

	it("has no leading or trailing blank lines (composes via join)", () => {
		const out = getScopePartialPrompt({ kind: "page", approxElements: 40 });
		expect(out).toBe(out.trim());
	});
});
