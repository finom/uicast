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
});
