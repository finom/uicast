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

// The `hidden` flag exists so host-only components (like RootFragment, the
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

// A handler shared across many components (e.g. onClick) would otherwise inline
// its full payload type on every component entry. Passing it as a common event
// hoists it into a single "# Common Events" block; each component references it
// by its JSON Schema `$id` instead of re-describing the payload.

describe("getComponentsPartialPrompt — common events", () => {
	const onClick = z
		.object({ x: z.number() })
		.meta({ $id: "MouseEvent", description: "fires on click" });

	it("describes a common event once and references it per component", () => {
		const A = createComponentDefinition({
			name: "A",
			description: "a",
			props: z.object({}),
			callbacks: { onClick },
		});
		const B = createComponentDefinition({
			name: "B",
			description: "b",
			props: z.object({}),
			callbacks: { onClick },
		});
		const out = getComponentsPartialPrompt([A, B], [onClick]);

		expect(out).toContain("# Common Events");
		expect(out).toContain("fires on click");
		expect(out).toContain("onClick(evt: MouseEvent)");
		// The payload type renders once (in the common block), not on every
		// component that wires the handler — that's the whole point.
		expect(out.split("{ x: number }").length - 1).toBe(1);
	});

	it("inlines a callback whose `$id` was not passed as a common event", () => {
		const A = createComponentDefinition({
			name: "A",
			description: "a",
			props: z.object({}),
			callbacks: { onClick },
		});
		const out = getComponentsPartialPrompt([A]); // no common events
		expect(out).not.toContain("# Common Events");
		expect(out).toContain("onClick(evt: { x: number })");
	});

	it("throws when a common event schema has no `$id`", () => {
		const noId = z.object({ x: z.number() }).meta({ description: "no id" });
		expect(() => getComponentsPartialPrompt([], [noId])).toThrow(
			/missing a JSON Schema/,
		);
	});

	it("throws on a duplicate common event `$id`", () => {
		const c1 = z.object({ x: z.number() }).meta({ $id: "dup" });
		const c2 = z.object({ y: z.string() }).meta({ $id: "dup" });
		expect(() =>
			getComponentsPartialPrompt([], [c1, c2]),
		).toThrow('Duplicate common event id: "dup"');
	});
});
