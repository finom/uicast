import { describe, expect, it } from "vitest";
import { z } from "zod";
import type { CombinedSpec } from "../types";
import { createComponentDefinition } from "../create-component-definition";

describe("createComponentDefinition — the reserved `children` name", () => {
	it("throws when props declare `children`", () => {
		expect(() =>
			createComponentDefinition({
				name: "Badge",
				description: "A badge.",
				props: z.strictObject({ children: z.string() }),
			}),
		).toThrow(/"children" is a reserved name/);
	});

	it("throws when a callback payload declares `children`", () => {
		expect(() =>
			createComponentDefinition({
				name: "Tree",
				description: "A tree.",
				props: z.strictObject({}),
				callbacks: { onExpand: z.strictObject({ children: z.array(z.string()) }) },
			}),
		).toThrow(/callback "onExpand" declares a "children" field/);
	});

	it("throws when a branch of union or intersection props declares `children`", () => {
		for (const props of [
			z.union([z.object({ text: z.string() }), z.object({ children: z.string() })]),
			z.object({ text: z.string() }).and(z.object({ children: z.string() })),
		]) {
			expect(() => createComponentDefinition({ name: "Badge", description: "A badge.", props })).toThrow(
				/"children" is a reserved name/,
			);
		}
	});

	it("allows `children` nested inside a prop's own shape", () => {
		const node = z.object({ label: z.string(), children: z.array(z.any()).optional() });
		expect(() =>
			createComponentDefinition({
				name: "TreeView",
				description: "A tree.",
				props: z.strictObject({ nodes: z.array(node) }),
			}),
		).not.toThrow();
	});

	it("returns the def unchanged otherwise", () => {
		const props = z.strictObject({ text: z.string() });
		const def = createComponentDefinition({ name: "Typography", description: "Text.", props });
		expect(def).toEqual({
			name: "Typography",
			description: "Text.",
			props,
			callbacks: undefined,
			hidden: undefined,
		});
	});
});

describe("createComponentDefinition — defaulted and odd specs", () => {
	it("defaults omitted props to a schema that accepts anything", () => {
		const def = createComponentDefinition({ name: "Divider", description: "A divider." });
		expect(def.props["~standard"].validate({ any: 1 })).toEqual({ value: { any: 1 } });
	});

	it("tolerates a spec whose jsonSchema.input throws", () => {
		const broken: CombinedSpec = {
			"~standard": {
				version: 1,
				vendor: "test",
				validate: (value) => ({ value }),
				jsonSchema: {
					input: () => {
						throw new Error("no schema");
					},
					output: () => {
						throw new Error("no schema");
					},
				},
			},
		};
		expect(() =>
			createComponentDefinition({ name: "Odd", description: "Odd.", props: broken }),
		).not.toThrow();
	});
});
