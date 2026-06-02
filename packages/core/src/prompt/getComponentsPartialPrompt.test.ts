import { describe, expect, it } from "vitest";
import { z } from "zod";
import { createAIComponentDef } from "../render/createAIComponentDef";
import { getComponentsPartialPrompt } from "./getComponentsPartialPrompt";

// The `hidden` flag exists so host-only components (like Fragment, the
// synthetic wrapper used by `Renderer`'s `init` prop) can be registered
// without being advertised to the LLM. The filter in
// `getComponentsPartialPrompt` is the enforcement point.

describe("getComponentsPartialPrompt — hidden filter", () => {
	it("includes visible defs", () => {
		const Visible = createAIComponentDef({
			name: "Visible",
			description: "A regular LLM-visible component",
			props: z.object({}),
		});
		expect(getComponentsPartialPrompt([Visible])).toContain("Visible");
	});

	it("excludes defs marked hidden: true", () => {
		const Visible = createAIComponentDef({
			name: "Visible",
			description: "advertised",
			props: z.object({}),
		});
		const Hidden = createAIComponentDef({
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
