import { describe, expect, it } from "vitest";
import { getErrorRecoveryPrompt } from "../get-error-recovery-prompt";

describe("getErrorRecoveryPrompt", () => {
  it("lists every failure with its key and message", () => {
    const out = getErrorRecoveryPrompt({
      failures: [
        { key: "chart", message: "chartData.map is not a function" },
        { key: "kpi", message: "scopes.root.totals is undefined" },
      ],
    });
    expect(out).toContain("Rendered UI has errors:");
    expect(out).toContain("`chart`: chartData.map is not a function");
    expect(out).toContain("`kpi`: scopes.root.totals is undefined");
  });

  it("annotates a failure with its reason and description", () => {
    const out = getErrorRecoveryPrompt({
      failures: [
        {
          key: "kpi",
          message: "x is not defined",
          reason: "unknown-reference",
        },
      ],
    });
    expect(out).toContain("- Entry `kpi`: x is not defined (unknown-reference — name doesn't exist");
  });

  it("leaves environment-fault reasons unannotated", () => {
    const out = getErrorRecoveryPrompt({
      failures: [{ key: "kpi", message: "fetch failed", reason: "host-function" }],
    });
    expect(out).toContain("- Entry `kpi`: fetch failed\n");
    expect(out).not.toContain("host-function");
  });

  it("asks for a corrected re-emit under the same key, fixing the cause", () => {
    const out = getErrorRecoveryPrompt({
      failures: [{ key: "table", message: "boom" }],
    });
    expect(out).toContain("same `key`");
    expect(out).toContain("Fix cause");
    expect(out).toContain("`seed`");
  });
});
