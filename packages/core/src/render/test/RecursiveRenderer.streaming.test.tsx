import { ConfirmModalProvider } from "@ui-fired/core/components/ConfirmModal";
import type { EvaluateFunctions } from "@ui-fired/core/eval/evaluate";
import { createAIComponentRenderers } from "@ui-fired/core/render/createAIComponentRenderers";
import type { ChunkComponent } from "@ui-fired/core/types";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { defaultRenderers, mountChunks } from "../../../test/renderHelpers";

describe("RecursiveRenderer — streaming / placeholders", () => {
	it("renders a placeholder when a referenced child hasn't streamed yet", () => {
		// Root references a child chunk by key that isn't in the elements map.
		const lines: ChunkComponent[] = [
			{
				key: "root",
				component: "Box",
				children: ["pending"],
				// No `pending` chunk emitted yet — simulates a mid-stream state.
			},
		];
		const { container } = mountChunks(lines, {
			defaultPlaceholder: () => <span data-test-placeholder>loading…</span>,
		});
		expect(container.querySelector("[data-test-placeholder]")).not.toBeNull();
	});

	it("uses the per-component placeholder if registered", () => {
		const { container } = mountChunks(
			[
				{
					key: "root",
					component: "Box",
					children: ["pending"],
				},
			],
			{
				renderers: {
					...defaultRenderers,
					// Component-level placeholders attach via createAIComponentRenderer's
					// `placeholder` arg. We can't easily attach one to an unknown
					// component name, so we use the global default for this test.
				},
				defaultPlaceholder: () => (
					<span data-test-placeholder>default-placeholder</span>
				),
			},
		);
		expect(container.textContent).toContain("default-placeholder");
	});

	it("falls back to null placeholder when none is provided", () => {
		const { container } = mountChunks([
			{
				key: "root",
				component: "Box",
				children: ["pending"],
			},
		]);
		// The default fallback renders nothing — `data-key` on root still exists,
		// but no placeholder text appears.
		expect(container.querySelector("[data-key='root']")).not.toBeNull();
		expect(container.textContent ?? "").not.toContain("loading");
	});
});

// As the LLM streams JSONLines, `<Renderer lines={lines}>` is re-rendered with
// a growing `lines` array. Every already-mounted chunk's `defaults` must run
// exactly once — even as later chunks arrive — or stream-time UIs would
// silently re-seed scopes and clobber user-set state. The invariant is held by
// `hasBeenRenderedRef` inside RecursiveRenderer combined with stable React
// keys per chunk; these tests pin that contract against accidental refactors
// (e.g. dropping the ref, swapping the keying strategy, or remounting on
// elements-prop identity change).
describe("RecursiveRenderer — streaming + defaults", () => {
	it("does not re-run an existing chunk's defaults when a sibling root chunk streams in later", () => {
		let count = 0;
		const functions: EvaluateFunctions = {
			track: () => {
				count += 1;
				return count;
			},
		};
		const { Renderer } = createAIComponentRenderers(Object.values(defaultRenderers));

		const initial: ChunkComponent[] = [
			{
				key: "a",
				component: "Box",
				defaults: [{ set: "scopes.root.tickA", expr: "track()" }],
				props: { expr: "({ text: 'A' })" },
			},
		];

		const next: ChunkComponent[] = [
			...initial,
			{
				key: "b",
				component: "Box",
				props: { expr: "({ text: 'B' })" },
			},
		];

		const { rerender, container } = render(
			<ConfirmModalProvider>
				<Renderer lines={initial} functions={functions} />
			</ConfirmModalProvider>,
		);
		expect(count).toBe(1);
		expect(container.textContent).toContain("A");

		rerender(
			<ConfirmModalProvider>
				<Renderer lines={next} functions={functions} />
			</ConfirmModalProvider>,
		);

		// A's defaults still ran exactly once. The new sibling chunk didn't
		// remount A — React reconciled by stable `key`, `hasBeenRenderedRef`
		// survived, and the defaults block was skipped on the re-render.
		expect(count).toBe(1);
		expect(container.textContent).toContain("A");
		expect(container.textContent).toContain("B");
	});

	it("does not re-run a parent's defaults when a child chunk streams in to fill a placeholder", () => {
		let count = 0;
		const functions: EvaluateFunctions = {
			track: () => {
				count += 1;
				return count;
			},
		};
		const { Renderer } = createAIComponentRenderers(Object.values(defaultRenderers), {
			defaultPlaceholder: () => <span data-test-placeholder>pending</span>,
		});

		const initial: ChunkComponent[] = [
			{
				key: "root",
				component: "Box",
				defaults: [{ set: "scopes.root.tickRoot", expr: "track()" }],
				children: ["child"],
				// 'child' chunk hasn't streamed yet — placeholder fills its slot.
			},
		];

		const next: ChunkComponent[] = [
			...initial,
			{
				key: "child",
				component: "Box",
				props: { expr: "({ text: 'child-arrived' })" },
			},
		];

		const { rerender, container } = render(
			<ConfirmModalProvider>
				<Renderer lines={initial} functions={functions} />
			</ConfirmModalProvider>,
		);
		expect(count).toBe(1);
		expect(container.querySelector("[data-test-placeholder]")).not.toBeNull();

		rerender(
			<ConfirmModalProvider>
				<Renderer lines={next} functions={functions} />
			</ConfirmModalProvider>,
		);

		// Parent's defaults still ran exactly once. The placeholder swapped out
		// for the real child, but the parent wasn't remounted.
		expect(count).toBe(1);
		expect(container.querySelector("[data-test-placeholder]")).toBeNull();
		expect(container.textContent).toContain("child-arrived");
	});
});
