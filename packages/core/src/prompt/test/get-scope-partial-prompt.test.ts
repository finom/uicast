import { describe, expect, it } from "vitest";
import { getScopePartialPrompt } from "../get-scope-partial-prompt";

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
    expect(out).not.toContain("entries (JSONL lines)");
    expect(out).not.toContain("not a quota");
  });

  it("renders approxEntries as a hint, not a quota", () => {
    const out = getScopePartialPrompt({ kind: "answer", approxEntries: 10 });
    expect(out).toContain("around 10 entries (JSONL lines) — treat this as a hint about ambition, not a quota");
  });

  it("renders note as a trailing ## Note section", () => {
    const out = getScopePartialPrompt({
      kind: "widget",
      note: "The widget renders inside a 400px sidebar.",
    });
    expect(out.endsWith("## Note\n\nThe widget renders inside a 400px sidebar.")).toBe(true);
  });

  it("has no leading or trailing blank lines (composes via join)", () => {
    const out = getScopePartialPrompt({ kind: "page", approxEntries: 40 });
    expect(out).toBe(out.trim());
  });
});
