import { act, render, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { StandardToolV0Definition } from "standard-tool";
import { Renderer } from "@ui-fired/react";
import type { ComponentEntry } from "@ui-fired/core";
import { defaultImplementationsList, mountEntries } from "../../../test/render-helpers";

describe("EntryRenderer — seed", () => {
  it("seeds root scope at mount via literal", () => {
    const lines: ComponentEntry[] = [
      {
        key: "root",
        component: "Box",
        seed: [{ set: "scopes.root.count", literal: 5 }],
        props: { expr: "({ text: scopes.root.count })" },
      },
    ];
    const { container, scopes } = mountEntries(lines);
    expect((scopes.root as Record<string, unknown>).count).toBe(5);
    expect(container.textContent).toContain("5");
  });

  it("seeds via expression", () => {
    const lines: ComponentEntry[] = [
      {
        key: "root",
        component: "Box",
        seed: [{ set: "scopes.root.total", expr: "2 + 2" }],
        props: { expr: "({ text: scopes.root.total })" },
      },
    ];
    const { container } = mountEntries(lines);
    expect(container.textContent).toContain("4");
  });

  it("runs each default exactly once on mount", () => {
    let count = 0;
    const lines: ComponentEntry[] = [
      {
        key: "root",
        component: "Box",
        seed: [{ set: "scopes.root.x", expr: "track()" }],
        props: { expr: "({ text: scopes.root.x })" },
      },
    ];
    const { container, scopes } = mountEntries(lines, {
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

    // Re-render via state change — seed must NOT fire again.
    act(() => {
      scopes.root.$set("other", "force-rerender");
    });
    expect(count).toBe(1);
    expect(container.textContent).toContain("1");
  });

  it("supports async seed via Suspense (use(promise))", async () => {
    // Uses the full <Renderer> rather than bare mountEntries: React 19 + RTL
    // only flush a top-level Suspense recovery when the initial mount runs
    // inside an *awaited* act() (see the same note in Renderer.init.test.tsx).
    // The async default is gated so it resolves inside act().
    const lines: ComponentEntry[] = [
      {
        key: "root",
        component: "Box",
        seed: [{ set: "scopes.root.data", expr: "loadData()" }],
        props: { expr: "({ text: scopes.root.data })" },
      },
    ];
    let resolveLoad!: (value: string) => void;
    const gate = new Promise<string>((resolve) => {
      resolveLoad = resolve;
    });
    const functions: StandardToolV0Definition[] = [
      { name: "loadData", description: "", execute: () => gate },
    ];

    let container!: HTMLElement;
    await act(async () => {
      container = render(
        <Renderer implementations={defaultImplementationsList} entries={lines} functions={functions} />,
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
