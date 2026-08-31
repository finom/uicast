import { describe, expect, it } from "vitest";
import {
	findNumericSetPath,
	findNumericSetSegment,
	numericSetPathError,
} from "../validate-set-path";
import { EntryError } from "../../entry-error";

describe("findNumericSetSegment", () => {
	it("finds an all-digit segment after the scope name", () => {
		expect(findNumericSetSegment("scopes.root.rows.0.qty")).toBe("0");
		expect(findNumericSetSegment("scopes.root.tags.10")).toBe("10");
		expect(findNumericSetSegment("root.rows.0.qty")).toBe("0");
	});

	it("passes clean paths", () => {
		expect(findNumericSetSegment("scopes.root.rows")).toBeNull();
		expect(findNumericSetSegment("scopes.root.filters.status")).toBeNull();
		expect(findNumericSetSegment("scopes.order.item.qty")).toBeNull();
	});

	it("does not flag segments merely containing digits", () => {
		expect(findNumericSetSegment("scopes.root.v2.x")).toBeNull();
		expect(findNumericSetSegment("scopes.root.item2")).toBeNull();
		expect(findNumericSetSegment("scopes.root.a0b")).toBeNull();
	});

	it("never flags the scope name itself", () => {
		// Only written keys are checked; the scope name is an addressing prefix.
		expect(findNumericSetSegment("scopes.0.field")).toBeNull();
	});
});

describe("numericSetPathError", () => {
	it("classifies as guardrail-violation and names the fix", () => {
		const err = numericSetPathError("scopes.root.rows.0.qty", "0", "grid");
		expect(EntryError.is(err)).toBe(true);
		expect(err.reason).toBe("guardrail-violation");
		expect(err.fault).toBe("document");
		expect(err.elementKey).toBe("grid");
		expect(err.message).toContain("scopes.root.rows.0.qty");
		expect(err.message).toContain("item scope");
		expect(err.message).toContain("replace the container");
	});
});

describe("findNumericSetPath", () => {
	it("returns null for a clean entry", () => {
		expect(
			findNumericSetPath({
				seed: [{ set: "scopes.root.rows", literal: [] }],
				callbacks: {
					onClick: [{ set: "scopes.root.open", expr: "!currentValue" }],
				},
			}),
		).toBeNull();
		expect(findNumericSetPath({})).toBeNull();
	});

	it("finds a numeric-key seed path", () => {
		expect(
			findNumericSetPath({
				seed: [{ set: "scopes.root.rows.0", literal: 1 }],
			}),
		).toEqual({ set: "scopes.root.rows.0", segment: "0" });
	});

	it("finds a numeric-key path in any callback handler", () => {
		expect(
			findNumericSetPath({
				callbacks: {
					onClick: [{ set: "scopes.root.open", literal: true }],
					onSave: [
						{ expr: "save()" }, // effect-only step — skipped
						{ set: "scopes.root.rows.2.name", expr: "evt.value" },
					],
				},
			}),
		).toEqual({ set: "scopes.root.rows.2.name", segment: "2" });
	});
});
