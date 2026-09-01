import { describe, expect, it } from "vitest";
import { z } from "zod";
import { createComponentDefinition } from "../../def/create-component-definition";
import { getComponentsPartialPrompt } from "../get-components-partial-prompt";

describe("getComponentsPartialPrompt — duplicate names", () => {
	// A flat `ComponentDefinition[]` (the catalog registry shape) carries no
	// name-uniqueness of its own; this builder — the one place every def is
	// consumed by name — imposes it as a fail-fast throw.
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
		expect(() => getComponentsPartialPrompt({ definitions: [A, B] })).toThrow(
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
		expect(getComponentsPartialPrompt({ definitions: [Visible] })).toContain(
			"Visible",
		);
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
		const out = getComponentsPartialPrompt({ definitions: [Visible, Hidden] });
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

	it("hoists a `$id` payload once and references it per component", () => {
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
		// No `commonEvents` argument — the `$id` on the callback is the signal.
		const out = getComponentsPartialPrompt({ definitions: [A, B] });

		expect(out).toContain("# Common Events");
		expect(out).toContain("- MouseEvent — fires on click");
		expect(out).toContain("onClick(evt: MouseEvent)");
		// The payload's fields render once (in the common block), not on every
		// component that wires the handler — that's the whole point.
		expect(out.split("- x: number").length - 1).toBe(1);
	});

	it("hoists a `$id` payload even when only one component uses it", () => {
		// Consistent with `# Shared Types`: a `$id` is a named concept, hoisted
		// regardless of usage count.
		const A = createComponentDefinition({
			name: "A",
			description: "a",
			props: z.object({}),
			callbacks: { onClick },
		});
		const out = getComponentsPartialPrompt({ definitions: [A] });
		expect(out).toContain("# Common Events");
		expect(out).toContain("- MouseEvent — fires on click");
		expect(out).toContain("onClick(evt: MouseEvent)");
	});

	it("inlines a callback whose payload has no `$id`", () => {
		const A = createComponentDefinition({
			name: "A",
			description: "a",
			props: z.object({}),
			callbacks: {
				onDrag: z.object({ x: z.number() }).meta({ description: "fires on drag" }),
			},
		});
		const out = getComponentsPartialPrompt({ definitions: [A] });
		expect(out).not.toContain("# Common Events");
		expect(out).toContain("    - onDrag(evt) — fires on drag");
		expect(out).toContain("      - x: number");
	});

	it("throws when two callbacks name the same `$id` with different payloads", () => {
		const A = createComponentDefinition({
			name: "A",
			description: "a",
			props: z.object({}),
			callbacks: { onX: z.object({ x: z.number() }).meta({ $id: "dup" }) },
		});
		const B = createComponentDefinition({
			name: "B",
			description: "b",
			props: z.object({}),
			callbacks: { onX: z.object({ y: z.string() }).meta({ $id: "dup" }) },
		});
		expect(() => getComponentsPartialPrompt({ definitions: [A, B] })).toThrow(
			/"dup" with different payloads/,
		);
	});
});

// A callback whose payload schema is `z.null()` carries no event data. Rather
// than advertise `(evt: null)` — which reads as "pass null" — the builder
// renders it as a no-arg handler, matching the `CallbacksToFunctions` type that
// makes the implementation's `onClick()` take no argument.

describe("getComponentsPartialPrompt — null callback payload", () => {
	it("renders a null-payload callback as a no-arg handler", () => {
		const A = createComponentDefinition({
			name: "A",
			description: "a",
			props: z.object({}),
			callbacks: { onPress: z.null() },
		});
		const out = getComponentsPartialPrompt({ definitions: [A] });
		expect(out).toContain("onPress()");
		expect(out).not.toContain("onPress(evt");
	});
});

// Every description the author writes should reach the prompt: a component's
// own description, each prop's, each event handler's, and each option of a typed
// event's payload. Props and event handlers render as described sub-lists; a
// typed event's options sit one level deeper, the way props do. The first test
// pins the whole block byte-for-byte (it's the spec the docs page mirrors).

describe("getComponentsPartialPrompt — descriptions on props, handlers, options", () => {
	it("surfaces the component, prop, and handler descriptions in one block", () => {
		const Counter = createComponentDefinition({
			name: "Counter",
			description:
				"A button that shows a number and increments it on each click.",
			props: z.strictObject({
				count: z
					.number()
					.default(0)
					.meta({ description: "The number to display" }),
			}),
			callbacks: {
				onClick: z
					.null()
					.meta({ description: "Fires when the counter is pressed" }),
			},
		});
		const out = getComponentsPartialPrompt({ definitions: [Counter] });
		expect(out).toBe(
			[
				"# Available Components",
				"",
				"Counter",
				"",
				"# Component Details",
				"",
				"- Counter — A button that shows a number and increments it on each click.",
				"  Props:",
				"    - count?: number = 0 — The number to display",
				"  Event handlers:",
				"    - onClick() — Fires when the counter is pressed",
			].join("\n"),
		);
	});

	it("lists a typed event's options, each with its description", () => {
		const A = createComponentDefinition({
			name: "A",
			description: "a",
			props: z.object({}),
			callbacks: {
				onSelect: z
					.object({ id: z.string().meta({ description: "The chosen row id" }) })
					.meta({ description: "Fires on selection" }),
			},
		});
		const out = getComponentsPartialPrompt({ definitions: [A] });
		expect(out).toContain("    - onSelect(evt) — Fires on selection");
		expect(out).toContain("      - id: string — The chosen row id");
	});

	it("prints a schema default the way TypeScript writes one", () => {
		// The engine applies the default before `render` sees the prop, so it is
		// what the model gets by omitting the field — worth telling it.
		const A = createComponentDefinition({
			name: "A",
			description: "a",
			props: z.object({
				size: z.enum(["sm", "lg"]).default("lg"),
				rows: z.array(z.string()).default([]),
				open: z.boolean().default(false).meta({ description: "Starts open" }),
			}),
		});
		const out = getComponentsPartialPrompt({ definitions: [A] });
		expect(out).toContain('    - size?: "sm" | "lg" = "lg"');
		expect(out).toContain("    - rows?: string[] = []");
		expect(out).toContain("    - open?: boolean = false — Starts open");
	});

	it("leaves a description-less prop as a bare type", () => {
		const A = createComponentDefinition({
			name: "A",
			description: "a",
			props: z.object({ label: z.string() }),
		});
		const out = getComponentsPartialPrompt({ definitions: [A] });
		expect(out).toContain("    - label: string");
		expect(out).not.toContain("label: string —");
	});
	it("renders note as a trailing ## Note section", () => {
		const Stat = createComponentDefinition({
			name: "Stat",
			description: "A KPI display.",
			props: z.object({}),
		});
		const out = getComponentsPartialPrompt({
			definitions: [Stat],
			note: "Prefer Card over raw FlexCol.",
		});
		expect(out.endsWith("## Note\n\nPrefer Card over raw FlexCol.")).toBe(true);
	});
});
