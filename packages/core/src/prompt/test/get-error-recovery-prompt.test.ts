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
		expect(out).toContain("runtime errors");
		expect(out).toContain("`chart`: chartData.map is not a function");
		expect(out).toContain("`kpi`: scopes.root.totals is undefined");
	});

	it("asks for a corrected re-emit under the same key, fixing the cause", () => {
		const out = getErrorRecoveryPrompt({
			failures: [{ key: "table", message: "boom" }],
		});
		expect(out).toContain("keeping its `key`");
		expect(out).toContain("Fix the cause");
		expect(out).toContain("`seed`");
	});
});
