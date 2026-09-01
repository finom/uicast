import { describe, expect, it } from "vitest";
import {
	findEntrySetPathFault,
	findNumericSetSegment,
	findSetPathFault,
	setPathError,
} from "../validate-set-path";
import { createProxyScope } from "../create-proxy-scope";
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

describe("findSetPathFault — prototype keys", () => {
	it("rejects every prototype-reaching key", () => {
		for (const key of [
			"__proto__",
			"constructor",
			"prototype",
			"__defineGetter__",
			"__defineSetter__",
			"__lookupGetter__",
			"__lookupSetter__",
		]) {
			expect(findSetPathFault(`scopes.root.${key}.x`)).toEqual({
				segment: key,
				kind: "prototype",
			});
		}
	});

	it("rejects a prototype key anywhere in the path", () => {
		expect(findSetPathFault("scopes.root.a.b.__proto__.c")).toEqual({
			segment: "__proto__",
			kind: "prototype",
		});
		// As the final written key, too.
		expect(findSetPathFault("scopes.root.__proto__")).toEqual({
			segment: "__proto__",
			kind: "prototype",
		});
	});

	it("rejects a prototype key used as the scope name", () => {
		// Unlike the numeric rule, the scope name is checked: a scope map is a
		// plain object, so `scopes.__proto__` reaches the chain the same way.
		expect(findSetPathFault("scopes.__proto__.x")).toEqual({
			segment: "__proto__",
			kind: "prototype",
		});
	});

	it("takes precedence over the numeric rule", () => {
		expect(findSetPathFault("scopes.root.rows.0.__proto__")).toEqual({
			segment: "__proto__",
			kind: "prototype",
		});
	});

	it("does not flag names that merely contain a prototype key", () => {
		expect(findSetPathFault("scopes.root.myconstructor")).toBeNull();
		expect(findSetPathFault("scopes.root.proto")).toBeNull();
		expect(findSetPathFault("scopes.root.__proto__x")).toBeNull();
	});
});

describe("setPathError", () => {
	it("classifies a numeric fault and names the fix", () => {
		const err = setPathError(
			"scopes.root.rows.0.qty",
			{ segment: "0", kind: "numeric" },
			"grid",
		);
		expect(EntryError.is(err)).toBe(true);
		expect(err.reason).toBe("guardrail-violation");
		expect(err.fault).toBe("document");
		expect(err.elementKey).toBe("grid");
		expect(err.message).toContain("scopes.root.rows.0.qty");
		expect(err.message).toContain("item scope");
		expect(err.message).toContain("replace the container");
	});

	it("classifies a prototype fault and names the fix", () => {
		const err = setPathError(
			"scopes.root.__proto__.isAdmin",
			{ segment: "__proto__", kind: "prototype" },
			"form",
		);
		expect(EntryError.is(err)).toBe(true);
		expect(err.reason).toBe("guardrail-violation");
		expect(err.elementKey).toBe("form");
		expect(err.message).toContain("__proto__");
		expect(err.message).toContain("prototype chain");
	});
});

describe("findEntrySetPathFault", () => {
	it("returns null for a clean entry", () => {
		expect(
			findEntrySetPathFault({
				seed: [{ set: "scopes.root.rows", literal: [] }],
				callbacks: {
					onClick: [{ set: "scopes.root.open", expr: "!currentValue" }],
				},
			}),
		).toBeNull();
		expect(findEntrySetPathFault({})).toBeNull();
	});

	it("finds a numeric-key seed path", () => {
		expect(
			findEntrySetPathFault({
				seed: [{ set: "scopes.root.rows.0", literal: 1 }],
			}),
		).toEqual({
			set: "scopes.root.rows.0",
			fault: { segment: "0", kind: "numeric" },
		});
	});

	it("finds a prototype-key seed path", () => {
		expect(
			findEntrySetPathFault({
				seed: [{ set: "scopes.root.__proto__.isAdmin", literal: true }],
			}),
		).toEqual({
			set: "scopes.root.__proto__.isAdmin",
			fault: { segment: "__proto__", kind: "prototype" },
		});
	});

	it("finds a bad path in any callback handler", () => {
		expect(
			findEntrySetPathFault({
				callbacks: {
					onClick: [{ set: "scopes.root.open", literal: true }],
					onSave: [
						{ expr: "save()" }, // effect-only step — skipped
						{ set: "scopes.root.rows.2.name", expr: "evt.value" },
					],
				},
			}),
		).toEqual({
			set: "scopes.root.rows.2.name",
			fault: { segment: "2", kind: "numeric" },
		});
	});
});

describe("createProxyScope sink guard (H3 regression)", () => {
	it("does not pollute Object.prototype through a __proto__ segment", () => {
		const scope = createProxyScope({ root: { user: { name: "a" } } });
		expect(() => scope.$set("root.__proto__.polluted", "PWNED")).toThrow(
			/prototype chain/,
		);
		expect(({} as Record<string, unknown>).polluted).toBeUndefined();
	});

	it("rejects a prototype key as the final written segment", () => {
		const scope = createProxyScope({ root: {} });
		expect(() => scope.$set("root.__proto__", { polluted2: 1 })).toThrow(
			/prototype chain/,
		);
		expect(({} as Record<string, unknown>).polluted2).toBeUndefined();
	});

	it("rejects constructor traversal", () => {
		const scope = createProxyScope({ root: { user: {} } });
		expect(() =>
			scope.$set("root.user.constructor.prototype.polluted3", "PWNED"),
		).toThrow(/prototype chain/);
		expect(({} as Record<string, unknown>).polluted3).toBeUndefined();
	});

	it("classifies the rejection as a document guardrail violation", () => {
		const scope = createProxyScope({ root: {} });
		try {
			scope.$set("root.__proto__.x", 1);
			expect.unreachable("should have thrown");
		} catch (err) {
			expect(EntryError.is(err)).toBe(true);
			expect((err as EntryError).reason).toBe("guardrail-violation");
		}
	});

	it("still writes ordinary paths", () => {
		const scope = createProxyScope({ root: { user: { name: "a" } } });
		scope.$set("root.user.name", "b");
		expect(scope.root.user.name).toBe("b");
	});
});
