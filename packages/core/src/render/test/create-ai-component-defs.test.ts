import { describe, expect, it } from "vitest";
import { z } from "zod";
import { createAIComponentDef } from "../create-ai-component-def";
import { createAIComponentDefs } from "../create-ai-component-defs";

// `createAIComponentDefs` is now a thin validating constructor: it returns the
// def array unchanged, but throws on a duplicate `name` — the array form loses
// the keyed-object's free duplicate protection. Prompt assembly moved out to
// `getComponentsPartialPrompt`.

describe("createAIComponentDefs", () => {
	it("returns the def array unchanged", () => {
		const A = createAIComponentDef({
			name: "A",
			description: "a",
			props: z.object({}),
		});
		const B = createAIComponentDef({
			name: "B",
			description: "b",
			props: z.object({}),
		});
		expect(createAIComponentDefs([A, B])).toEqual([A, B]);
	});

	it("throws on a duplicate component name", () => {
		const A = createAIComponentDef({
			name: "Dup",
			description: "first",
			props: z.object({}),
		});
		const B = createAIComponentDef({
			name: "Dup",
			description: "second",
			props: z.object({}),
		});
		expect(() => createAIComponentDefs([A, B])).toThrow(
			'Duplicate component name: "Dup"',
		);
	});
});
