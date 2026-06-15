import { describe, expect, it } from "vitest";
import { z } from "zod";
import { createComponentDefinition } from "../../def/create-component-definition";
import { getComponentsPartialPrompt } from "../get-components-partial-prompt";

describe("getComponentsPartialPrompt — duplicate names", () => {
	// The catalog registry is a flat `ComponentDefinition[]` (`defs.ts`), which
	// lost the keyed-object registry's free name-uniqueness. This builder — the
	// one place every def is consumed by name — re-imposes it as a fail-fast
	// throw (relocated here when `createComponentDefinitions` was removed).
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
		expect(() => getComponentsPartialPrompt([A, B])).toThrow(
			'Duplicate component name: "Dup"',
		);
	});
});

// The `hidden` flag exists so host-only components (like Fragment, the
// synthetic wrapper used by `Renderer`'s `init` prop) can be registered
// without being advertised to the LLM. The filter in
// `getComponentsPartialPrompt` is the enforcement point.

describe("getComponentsPartialPrompt — hidden filter", () => {
	it("includes visible defs", () => {
		const Visible = createComponentDefinition({
			name: "Visible",
			description: "A regular LLM-visible component",
			props: z.object({}),
		});
		expect(getComponentsPartialPrompt([Visible])).toContain("Visible");
	});

	it("excludes defs marked hidden: true", () => {
		const Visible = createComponentDefinition({
			name: "Visible",
			description: "advertised",
			props: z.object({}),
		});
		const Hidden = createComponentDefinition({
			name: "Hidden",
			description: "host-only",
			props: z.object({}),
			hidden: true,
		});
		const out = getComponentsPartialPrompt([Visible, Hidden]);
		expect(out).toContain("Visible");
		expect(out).not.toContain("Hidden");
		// The component name should also not appear in the "# Component
		// Details" detail section — guard against a future regression where
		// the names-list filter and the details-list filter diverge.
		expect(out).not.toContain("host-only");
	});
});
