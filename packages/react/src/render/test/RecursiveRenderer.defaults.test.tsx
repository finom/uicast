import { act, render, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { StandardTool } from "standard-tool";
import { Renderer } from "@ui-fired/react";
import type { Fired } from "@ui-fired/core/types";
import { defaultRenderersList, mountChunks } from "../../../test/renderHelpers";

describe("RecursiveRenderer — defaults", () => {
  it("seeds root scope at mount via literal", () => {
    const lines: Fired.Element[] = [
      {
        key: "root",
        component: "Box",
        defaults: [{ set: "scopes.root.count", literal: 5 }],
        props: { expr: "({ text: scopes.root.count })" },
      },
    ];
    const { container, scopes } = mountChunks(lines);
    expect((scopes.root as Record<string, unknown>).count).toBe(5);
    expect(container.textContent).toContain("5");
  });

  it("seeds via expression", () => {
    const lines: Fired.Element[] = [
      {
        key: "root",
        component: "Box",
        defaults: [{ set: "scopes.root.total", expr: "2 + 2" }],
        props: { expr: "({ text: scopes.root.total })" },
      },
    ];
    const { container } = mountChunks(lines);
    expect(container.textContent).toContain("4");
  });

  it("runs each default exactly once on mount", () => {
    let count = 0;
    const lines: Fired.Element[] = [
      {
        key: "root",
        component: "Box",
        defaults: [{ set: "scopes.root.x", expr: "track()" }],
        props: { expr: "({ text: scopes.root.x })" },
      },
    ];
    const { container, scopes } = mountChunks(lines, {
      functions: [
        {
          name: "track",
          description: "",
          execute() {
            count += 1;
            return count;
          },
        },
      ],
    });
    expect(count).toBe(1);

    // Re-render via state change — defaults must NOT fire again.
    act(() => {
      scopes.root.$set("other", "force-rerender");
    });
    expect(count).toBe(1);
    expect(container.textContent).toContain("1");
  });

  it("supports async defaults via Suspense (use(promise))", async () => {
    // Uses the full <Renderer> rather than bare mountChunks: React 19 + RTL
    // only flush a top-level Suspense recovery when the initial mount runs
    // inside an *awaited* act() (see the same note in Renderer.init.test.tsx).
    // The async default is gated so it resolves inside act().
    const lines: Fired.Element[] = [
      {
        key: "root",
        component: "Box",
        defaults: [{ set: "scopes.root.data", expr: "loadData()" }],
        props: { expr: "({ text: scopes.root.data })" },
      },
    ];
    let resolveLoad!: (value: string) => void;
    const gate = new Promise<string>((resolve) => {
      resolveLoad = resolve;
    });
    const functions: StandardTool[] = [
      { name: "loadData", description: "", execute: () => gate },
    ];

    let container!: HTMLElement;
    await act(async () => {
      container = render(
        <Renderer catalog={defaultRenderersList} lines={lines} functions={functions} />,
      ).container;
    });
    // Suspended on the pending default — the value isn't shown yet.
    expect(container.textContent ?? "").not.toContain("loaded-value");

    await act(async () => {
      resolveLoad("loaded-value");
    });
    await waitFor(() => {
      expect(container.textContent).toContain("loaded-value");
    });
  });
});
