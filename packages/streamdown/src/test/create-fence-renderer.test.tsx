import { cleanup, fireEvent, render } from "@testing-library/react";
import type { ReactNode } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Evaluator, type StandardToolV0 } from "@uicast/expr";
import { z } from "zod";
import { createComponentDefinition, type ComponentEntry } from "@uicast/core";
import {
	createComponentImplementation,
	RendererProvider,
} from "@uicast/react";
import { createFenceRenderer } from "../create-fence-renderer";
import { FENCE_LANGUAGE } from "../parse-fence-code";

const boxDef = createComponentDefinition({
	name: "Box",
	description: "A plain div with optional text",
	props: z.object({ text: z.union([z.string(), z.number()]).optional() }),
});

const boxImpl = createComponentImplementation({
	def: boxDef,
	render: ({ text, children}, { entry }) => (
		<div data-key={entry.key}>
			{text}
			{children}
		</div>
	),
});

// Module const so the registry reference stays stable across rerenders.
const implementations = [boxImpl];

const defaultEvaluator = new Evaluator();

const Host = ({
	evaluator = defaultEvaluator,
	children,
}: {
	evaluator?: Evaluator;
	children: ReactNode;
}) => (
	<RendererProvider implementations={implementations} evaluator={evaluator}>
		{children}
	</RendererProvider>
);

const line = (entry: ComponentEntry) => JSON.stringify(entry);

// No vitest globals, so RTL cannot auto-register its cleanup.
afterEach(cleanup);

describe("createFenceRenderer — FenceBlock", () => {
	it("routes the uicast fence language", () => {
		expect(createFenceRenderer().language).toBe(FENCE_LANGUAGE);
	});

	it("renders a complete fence inside <RendererProvider>", () => {
		const Fence = createFenceRenderer().component;
		const code = [
			line({
				key: "root",
				component: "Box",
				children: ["a"],
				props: { literal: { text: "hello" } },
			}),
			line({ key: "a", component: "Box", props: { literal: { text: "world" } } }),
		].join("\n");
		const { container } = render(
			<Host>
				<Fence code={code} isIncomplete={false} language={FENCE_LANGUAGE} />
			</Host>,
		);
		expect(container.textContent).toContain("hello");
		expect(container.textContent).toContain("world");
	});

	it("mounts entries progressively and ignores the truncated last line", () => {
		const Fence = createFenceRenderer().component;
		const one = line({ key: "e1", component: "Box", props: { literal: { text: "one" } } });
		const two = line({ key: "e2", component: "Box", props: { literal: { text: "two" } } });
		const three = line({ key: "e3", component: "Box", props: { literal: { text: "three" } } });
		const at = (code: string) => (
			<Host>
				<Fence code={code} isIncomplete language={FENCE_LANGUAGE} />
			</Host>
		);
		const { container, rerender } = render(at(one));
		expect(container.textContent).toContain("one");

		rerender(at(`${one}\n${two.slice(0, 11)}`));
		expect(container.textContent).toContain("one");
		expect(container.textContent).not.toContain("two");

		rerender(at(`${one}\n${two}\n${three.slice(0, 11)}`));
		expect(container.textContent).toContain("two");
		expect(container.textContent).not.toContain("three");

		rerender(at(`${one}\n${two}\n${three}`));
		expect(container.textContent).toContain("three");
	});

	it("runs a seed exactly once while the fence grows", () => {
		const Fence = createFenceRenderer().component;
		let calls = 0;
		const functions: StandardToolV0[] = [
			{
				name: "track",
				description: "",
				execute() {
					calls += 1;
					return calls;
				},
			},
		];
		const evaluator = new Evaluator({ functions });
		const seeded = line({
			key: "seeded",
			component: "Box",
			seed: [{ set: "scopes.root.n", expr: "track()" }],
			props: { expr: "({ text: 'seeded ' + scopes.root.n })" },
		});
		const more = line({ key: "more", component: "Box", props: { literal: { text: "extra" } } });
		const at = (code: string, isIncomplete: boolean) => (
			<Host evaluator={evaluator}>
				<Fence code={code} isIncomplete={isIncomplete} language={FENCE_LANGUAGE} />
			</Host>
		);
		const { container, rerender } = render(at(seeded, true));
		expect(calls).toBe(1);

		rerender(at(`${seeded}\n${more.slice(0, 11)}`, true));
		rerender(at(`${seeded}\n${more}`, true));
		rerender(at(`${seeded}\n${more}`, false));
		expect(calls).toBe(1);
		expect(container.textContent).toContain("seeded 1");
		expect(container.textContent).toContain("extra");
	});

	it("does not retry a failed seed on stream ticks (entry identity is cache-stable)", () => {
		const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
		const Fence = createFenceRenderer().component;
		let calls = 0;
		const functions: StandardToolV0[] = [
			{
				name: "boom",
				description: "",
				execute() {
					calls += 1;
					throw new Error("BOOM_FROM_SEED");
				},
			},
		];
		const evaluator = new Evaluator({ functions });
		const bad = line({
			key: "bad",
			component: "Box",
			seed: [{ set: "scopes.root.x", expr: "boom()" }],
			props: { literal: { text: "never" } },
		});
		const more = line({ key: "more", component: "Box", props: { literal: { text: "extra" } } });
		const at = (code: string) => (
			<Host evaluator={evaluator}>
				<Fence code={code} isIncomplete language={FENCE_LANGUAGE} />
			</Host>
		);
		const { container, rerender } = render(at(bad));
		// React itself may retry a throwing render once — pin the settled count,
		// not the literal.
		const callsAfterMount = calls;
		expect(callsAfterMount).toBeGreaterThan(0);
		expect(container.textContent).toContain("Render error");

		rerender(at(`${bad}\n${more.slice(0, 11)}`));
		rerender(at(`${bad}\n${more}`));
		expect(calls).toBe(callsAfterMount);
		expect(container.textContent).toContain("extra");
		consoleError.mockRestore();
	});

	it("survives malformed JSON mid-stream", () => {
		const Fence = createFenceRenderer().component;
		const good = line({ key: "g1", component: "Box", props: { literal: { text: "first" } } });
		const garbage = '{"key": broken not json}';
		const alsoGood = line({ key: "g2", component: "Box", props: { literal: { text: "second" } } });
		const { container } = render(
			<Host>
				<Fence
					code={[good, garbage, alsoGood].join("\n")}
					isIncomplete
					language={FENCE_LANGUAGE}
				/>
			</Host>,
		);
		expect(container.textContent).toContain("first");
		expect(container.textContent).toContain("second");
	});
});

describe("createFenceRenderer — source toggle", () => {
	const entryLine = line({
		key: "root",
		component: "Box",
		props: { literal: { text: "content" } },
	});

	it("shows the toggle only once a complete entry exists in a streaming fence", () => {
		const Fence = createFenceRenderer({ showSourceToggle: true }).component;
		const at = (code: string) => (
			<Host>
				<Fence code={code} isIncomplete language={FENCE_LANGUAGE} />
			</Host>
		);
		const { queryByText, rerender } = render(at(entryLine.slice(0, 11)));
		expect(queryByText("Rendered")).toBeNull();
		expect(queryByText("Source")).toBeNull();

		rerender(at(`${entryLine}\n${entryLine.slice(0, 11)}`));
		expect(queryByText("Rendered")).not.toBeNull();
		expect(queryByText("Source")).not.toBeNull();
	});

	it("shows the toggle for a finished fence even when it produced no entries", () => {
		const Fence = createFenceRenderer({ showSourceToggle: true }).component;
		const { queryByText } = render(
			<Host>
				<Fence code="just some prose" isIncomplete={false} language={FENCE_LANGUAGE} />
			</Host>,
		);
		expect(queryByText("Source")).not.toBeNull();
	});

	it("keeps the block mounted while source shows — the seed does not re-run", () => {
		const Fence = createFenceRenderer({ showSourceToggle: true }).component;
		let calls = 0;
		const functions: StandardToolV0[] = [
			{
				name: "track",
				description: "",
				execute() {
					calls += 1;
					return calls;
				},
			},
		];
		const evaluator = new Evaluator({ functions });
		const code = line({
			key: "seeded",
			component: "Box",
			seed: [{ set: "scopes.root.n", expr: "track()" }],
			props: { expr: "({ text: 'seeded ' + scopes.root.n })" },
		});
		const { container, getByText } = render(
			<Host evaluator={evaluator}>
				<Fence code={code} isIncomplete={false} language={FENCE_LANGUAGE} />
			</Host>,
		);
		expect(calls).toBe(1);

		fireEvent.click(getByText("Source"));
		expect(container.querySelector("pre")?.textContent).toBe(code);
		const hiddenBlock = container.querySelector("div[hidden]");
		expect(hiddenBlock?.textContent).toContain("seeded 1");

		fireEvent.click(getByText("Rendered"));
		expect(container.querySelector("pre")).toBeNull();
		expect(container.querySelector("div[hidden]")).toBeNull();
		expect(container.textContent).toContain("seeded 1");
		expect(calls).toBe(1);
	});
});

describe("createFenceRenderer — client-only gate", () => {
	it("renders no entries and runs no seeds during SSR; the client mount seeds once", () => {
		const Fence = createFenceRenderer().component;
		let calls = 0;
		const functions: StandardToolV0[] = [
			{
				name: "track",
				description: "",
				execute() {
					calls += 1;
					return calls;
				},
			},
		];
		const evaluator = new Evaluator({ functions });
		const code = line({
			key: "seeded",
			component: "Box",
			seed: [{ set: "scopes.root.n", expr: "track()" }],
			props: { expr: "({ text: 'seeded ' + scopes.root.n })" },
		});
		const at = () => (
			<Host evaluator={evaluator}>
				<Fence code={code} isIncomplete={false} language={FENCE_LANGUAGE} />
			</Host>
		);

		const html = renderToString(at());
		expect(calls).toBe(0);
		expect(html).not.toContain("seeded");

		const { container } = render(at());
		expect(calls).toBe(1);
		expect(container.textContent).toContain("seeded 1");
	});
});
