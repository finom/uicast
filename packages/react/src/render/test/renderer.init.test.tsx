import { act, render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EntriesRenderer, RendererProvider } from "@uicast/react";
import type { InitFn } from "@uicast/react/types";
import type { ComponentEntry } from "@uicast/core";
import { defaultImplementationsList } from "../../../test/render-helpers";

// `init` is the host-supplied side-effect callback that runs exactly once
// on the synthetic RootFragment wrapper's mount, before any LLM-emitted root
// entry evaluates. The wrapper is always inserted (init or not) so tree
// topology stays consistent — the RootFragment renders children directly via
// React.Fragment, no extra DOM.
//
// These tests pin the contract: writes via the reactive Proxy land before
// children mount (sync), Suspense gates children on async init Promises,
// and the streaming-seed one-shot invariant (per-entry seed attempts)
// carries over so init does NOT re-fire when new entries stream in.

describe("Renderer — init prop", () => {
	it("sync init seeds scope before children mount", () => {
		const lines: ComponentEntry[] = [
			{
				key: "root",
				component: "Box",
				props: { expr: "({ text: scopes.root.greeting })" },
			},
		];

		const init: InitFn = ({ scopes }) => {
			(scopes.root as Record<string, unknown>).greeting = "hello";
		};

		const { container } = render(<RendererProvider implementations={defaultImplementationsList} init={init}><EntriesRenderer entries={lines} /></RendererProvider>);
		expect(container.textContent).toContain("hello");
	});

	it("async init Suspends until the Promise resolves, then renders children", async () => {
		const lines: ComponentEntry[] = [
			{
				key: "root",
				component: "Box",
				props: { expr: "({ text: scopes.root.headings })" },
			},
		];

		// Externally-controlled gate so we can assert the Suspense
		// fallback is on screen BEFORE we let init resolve.
		let resolveInit!: () => void;
		const initGate = new Promise<void>((resolve) => {
			resolveInit = resolve;
		});

		const init: InitFn = async ({ scopes }) => {
			await initGate;
			(scopes.root as Record<string, unknown>).headings = "resolved";
		};

		// React 19 + testing-library: the initial mount must run inside an
		// awaited `act` for Suspense recovery to flush properly. Without
		// this, React schedules the resumption but never gets the
		// opportunity to re-invoke the suspended Comp — the test will
		// hang seeing only the fallback.
		let container!: HTMLElement;
		await act(async () => {
			const result = render(<RendererProvider implementations={defaultImplementationsList} init={init}><EntriesRenderer entries={lines} /></RendererProvider>);
			container = result.container;
		});

		// Still suspended: Box never mounted, fallback path rendered only
		// the (empty) Placeholder.
		expect(container.textContent).not.toContain("resolved");

		await act(async () => {
			resolveInit();
		});

		await waitFor(() => {
			expect(container.textContent).toContain("resolved");
		});
	});

	it("renders normally when init is omitted (RootFragment wrap is invisible)", () => {
		const lines: ComponentEntry[] = [
			{
				key: "root",
				component: "Box",
				props: { expr: "({ text: 'plain' })" },
			},
		];

		const { container } = render(<RendererProvider implementations={defaultImplementationsList}><EntriesRenderer entries={lines} /></RendererProvider>);
		expect(container.textContent).toContain("plain");

		// The RootFragment wrapper renders via React.Fragment — no extra DOM
		// node should appear above the root Box. The Box renders a <div>
		// with data-key="root"; that should be a direct child of the test
		// container's root element.
		const rootBox = container.querySelector('[data-key="root"]');
		expect(rootBox).not.toBeNull();
		// Sanity: the wrapper never injects a wrapping element with the
		// synthetic key — the RootFragment is purely React-level.
		expect(
			container.querySelector('[data-key="__root_fragment__"]'),
		).toBeNull();
	});

	it("init fires exactly once even as new entries stream in (rerender)", () => {
		const initSpy = vi.fn<InitFn>(({ scopes }) => {
			(scopes.root as Record<string, unknown>).seed = "once";
		});
		const initialLines: ComponentEntry[] = [
			{
				key: "a",
				component: "Box",
				props: { expr: "({ text: 'A:' + scopes.root.seed })" },
			},
		];
		const { container, rerender } = render(<RendererProvider implementations={defaultImplementationsList} init={initSpy}><EntriesRenderer entries={initialLines} /></RendererProvider>);
		expect(initSpy).toHaveBeenCalledTimes(1);
		expect(container.textContent).toContain("A:once");

		const nextLines: ComponentEntry[] = [
			...initialLines,
			{
				key: "b",
				component: "Box",
				props: { expr: "({ text: 'B:' + scopes.root.seed })" },
			},
		];
		rerender(<RendererProvider implementations={defaultImplementationsList} init={initSpy}><EntriesRenderer entries={nextLines} /></RendererProvider>);

		// The synthetic RootFragment reconciled by stable key — init did NOT
		// re-fire when a new sibling root entry streamed in.
		expect(initSpy).toHaveBeenCalledTimes(1);
		expect(container.textContent).toContain("A:once");
		expect(container.textContent).toContain("B:once");
	});

	it("wraps multi-root trees under a single RootFragment; init fires once for the whole tree", () => {
		const initSpy = vi.fn<InitFn>(({ scopes }) => {
			(scopes.root as Record<string, unknown>).label = "shared";
		});
		const lines: ComponentEntry[] = [
			{
				key: "rootA",
				component: "Box",
				props: { expr: "({ text: 'A=' + scopes.root.label })" },
			},
			{
				key: "rootB",
				component: "Box",
				props: { expr: "({ text: 'B=' + scopes.root.label })" },
			},
		];

		const { container } = render(<RendererProvider implementations={defaultImplementationsList} init={initSpy}><EntriesRenderer entries={lines} /></RendererProvider>);

		expect(initSpy).toHaveBeenCalledTimes(1);
		expect(container.textContent).toContain("A=shared");
		expect(container.textContent).toContain("B=shared");
	});

	it("seeds nested object state — downstream entry reads via string expression", () => {
		const lines: ComponentEntry[] = [
			{
				key: "root",
				component: "Box",
				props: {
					expr: "({ text: scopes.root.headings.customers.email })",
				},
			},
		];

		const init: InitFn = ({ scopes }) => {
			(scopes.root as Record<string, unknown>).headings = {
				customers: { email: "Email", customer: "Customer" },
				orders: { total: "Total" },
			};
		};

		const { container } = render(<RendererProvider implementations={defaultImplementationsList} init={init}><EntriesRenderer entries={lines} /></RendererProvider>);
		expect(container.textContent).toContain("Email");
	});
});
