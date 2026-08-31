import { describe, expect, it } from "vitest";
import { z } from "zod";
import type { CombinedSpec } from "../../types";
import { createComponentDefinition, NO_PROPS } from "../create-component-definition";

// `children` is the entry field naming child elements. A def taking it as a
// prop would put two different things behind one name, and the renderer's
// React children would silently win over the document's value.
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

	it("allows `children` nested inside a prop's own shape", () => {
		// Only the top level is reserved — a tree node's `children` is data.
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
		const def = createComponentDefinition({ name: "Text", description: "Text.", props });
		expect(def).toEqual({
			name: "Text",
			description: "Text.",
			props,
			callbacks: undefined,
			hidden: undefined,
		});
	});
});

describe("createComponentDefinition — defaulted and odd specs", () => {
	it("defaults omitted props to NO_PROPS, which accepts anything", () => {
		const def = createComponentDefinition({ name: "Divider", description: "A divider." });
		expect(def.props).toBe(NO_PROPS);
		expect(def.props["~standard"].validate({ any: 1 })).toEqual({ value: { any: 1 } });
	});

	it("tolerates a spec whose jsonSchema.input throws", () => {
		// The reserved-name check needs the schema's property names; a spec that
		// cannot convert fails loudly in the prompt builder instead, not here.
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
