import type { StandardToolV0 } from "standard-tool";
import {
	createComponentImplementation,
	EntriesRenderer,
	RendererProvider,
} from "@uicast/react";
import { createComponentDefinition, type ComponentEntry } from "@uicast/core";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Evaluator } from "@uicast/expr";
import { z } from "zod";
import {
	defaultImplementations,
	defaultImplementationsList,
	mountEntries,
} from "../../../test/render-helpers";

describe("EntryRenderer — streaming / placeholders", () => {
	it("renders a placeholder when a referenced child hasn't streamed yet, with reason 'streaming'", () => {
		const lines: ComponentEntry[] = [
			{
				key: "root",
				component: "Box",
				children: ["pending"],
			},
		];
		const { container } = mountEntries(lines, {
			fallbackComponents: {
				placeholder: ({ reason }) => <span data-test-placeholder>{reason}</span>,
			},
		});
		const ph = container.querySelector("[data-test-placeholder]");
		expect(ph).not.toBeNull();
		expect(ph?.textContent).toBe("streaming");
	});

	it("uses the parent's per-component placeholder for an unstreamed child, over the global one", () => {
		const phBoxImpl = createComponentImplementation({
			def: createComponentDefinition({
				name: "PhBox",
				description: "A box with its own placeholder",
				props: z.object({}),
			}),
			render: ({ children}, { entry }) => (
				<div data-key={entry.key}>{children}</div>
			),
			placeholder: () => <span data-box-ph />,
		});
		const { container } = mountEntries(
			[
				{
					key: "root",
					component: "PhBox",
					children: ["pending"],
				},
			],
			{
				implementations: { ...defaultImplementations, PhBox: phBoxImpl },
				fallbackComponents: {
					placeholder: () => <span data-global-ph />,
				},
			},
		);
		expect(container.querySelector("[data-box-ph]")).not.toBeNull();
		expect(container.querySelector("[data-global-ph]")).toBeNull();
	});

	it("falls back to null placeholder when none is provided", () => {
		const { container } = mountEntries([
			{
				key: "root",
				component: "Box",
				children: ["pending"],
			},
		]);
		expect(container.querySelector("[data-key='root']")).not.toBeNull();
		expect(container.textContent ?? "").not.toContain("loading");
	});
});

describe("EntryRenderer — streaming + seed", () => {
	it("does not re-run an existing entry's seed when a sibling root entry streams in later", () => {
		let count = 0;
		const functions: StandardToolV0[] = [
			{
				name: "track",
				description: "",
				execute() {
					count += 1;
					return count;
				},
			},
		];
		const evaluator = new Evaluator({ functions });
		const initial: ComponentEntry[] = [
			{
				key: "a",
				component: "Box",
				seed: [{ set: "scopes.root.tickA", expr: "track()" }],
				props: { expr: "({ text: 'A' })" },
			},
		];

		const next: ComponentEntry[] = [
			...initial,
			{
				key: "b",
				component: "Box",
				props: { expr: "({ text: 'B' })" },
			},
		];

		const { rerender, container } = render(<RendererProvider implementations={defaultImplementationsList} evaluator={evaluator}><EntriesRenderer entries={initial} /></RendererProvider>);
		expect(count).toBe(1);
		expect(container.textContent).toContain("A");

		rerender(<RendererProvider implementations={defaultImplementationsList} evaluator={evaluator}><EntriesRenderer entries={next} /></RendererProvider>);

		expect(count).toBe(1);
		expect(container.textContent).toContain("A");
		expect(container.textContent).toContain("B");
	});

	it("does not re-run a parent's seed when a child entry streams in to fill a placeholder", () => {
		let count = 0;
		const functions: StandardToolV0[] = [
			{
				name: "track",
				description: "",
				execute() {
					count += 1;
					return count;
				},
			},
		];
		const evaluator = new Evaluator({ functions });
		const fallbackComponents = {
			placeholder: () => <span data-test-placeholder>pending</span>,
		};

		const initial: ComponentEntry[] = [
			{
				key: "root",
				component: "Box",
				seed: [{ set: "scopes.root.tickRoot", expr: "track()" }],
				children: ["child"],
			},
		];

		const next: ComponentEntry[] = [
			...initial,
			{
				key: "child",
				component: "Box",
				props: { expr: "({ text: 'child-arrived' })" },
			},
		];

		const { rerender, container } = render(
			<RendererProvider fallbackComponents={fallbackComponents} implementations={defaultImplementationsList} evaluator={evaluator}><EntriesRenderer entries={initial} /></RendererProvider>,
		);
		expect(count).toBe(1);
		expect(container.querySelector("[data-test-placeholder]")).not.toBeNull();

		rerender(<RendererProvider fallbackComponents={fallbackComponents} implementations={defaultImplementationsList} evaluator={evaluator}><EntriesRenderer entries={next} /></RendererProvider>);

		expect(count).toBe(1);
		expect(container.querySelector("[data-test-placeholder]")).toBeNull();
		expect(container.textContent).toContain("child-arrived");
	});
});
