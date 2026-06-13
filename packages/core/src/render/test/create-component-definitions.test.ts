import { describe, expect, it } from "vitest";
import { z } from "zod";
import { createComponentDefinition } from "../create-component-definition";
import { createComponentDefinitions } from "../create-component-definitions";

// `createComponentDefinitions` is now a thin validating constructor: it returns the
// def array unchanged, but throws on a duplicate `name` — the array form loses
// the keyed-object's free duplicate protection. Prompt assembly moved out to
// `getComponentsPartialPrompt`.

describe("createComponentDefinitions", () => {
	it("returns the def array unchanged", () => {
		const A = createComponentDefinition({
			name: "A",
			description: "a",
			props: z.object({}),
		});
		const B = createComponentDefinition({
			name: "B",
			description: "b",
			props: z.object({}),
		});
		expect(createComponentDefinitions([A, B])).toEqual([A, B]);
	});

	it("throws on a duplicate component name", () => {
		const A = createComponentDefinition({
			name: "Dup",
			description: "first",
			props: z.object({}),
		});
		const B = createComponentDefinition({
			name: "Dup",
			description: "second",
			props: z.object({}),
		});
		expect(() => createComponentDefinitions([A, B])).toThrow(
			'Duplicate component name: "Dup"',
		);
	});
});
