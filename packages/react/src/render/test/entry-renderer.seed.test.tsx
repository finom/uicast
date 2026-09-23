import { act, render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Evaluator } from "@uicast/expr";
import type { StandardToolV0 } from "standard-tool";
import { EntriesRenderer, RendererProvider } from "@uicast/react";
import type { ComponentEntry } from "@uicast/core";
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

  it("runs each seed step exactly once on mount", () => {
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

    act(() => {
      scopes.root.$$set("other", "force-rerender");
    });
    expect(count).toBe(1);
    expect(container.textContent).toContain("1");
  });

  it("supports async seed via Suspense (use(promise))", async () => {
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
    const functions: StandardToolV0[] = [
      { name: "loadData", description: "", execute: () => gate },
    ];
    const evaluator = new Evaluator({ functions });

    let container!: HTMLElement;
    await act(async () => {
      container = render(
        <RendererProvider implementations={defaultImplementationsList} evaluator={evaluator}><EntriesRenderer entries={lines} /></RendererProvider>,
      ).container;
    });
    expect(container.textContent ?? "").not.toContain("loaded-value");

    await act(async () => {
      resolveLoad("loaded-value");
    });
    await waitFor(() => {
      expect(container.textContent).toContain("loaded-value");
    });
  });

  it("shows the placeholder with reason 'seeding' while an async seed resolves", async () => {
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
    const functions: StandardToolV0[] = [
      { name: "loadData", description: "", execute: () => gate },
    ];
    const evaluator = new Evaluator({ functions });

    let container!: HTMLElement;
    await act(async () => {
      container = render(
        <RendererProvider
          implementations={defaultImplementationsList}
          evaluator={evaluator}
          fallbackComponents={{
            placeholder: ({ reason }) => <span data-ph>{reason}</span>,
          }}
        >
          <EntriesRenderer entries={lines} />
        </RendererProvider>,
      ).container;
    });
    expect(container.querySelector("[data-ph]")?.textContent).toBe("seeding");

    await act(async () => {
      resolveLoad("done");
    });
    await waitFor(() => {
      expect(container.querySelector("[data-ph]")).toBeNull();
      expect(container.textContent).toContain("done");
    });
  });

  it("stays silent when an async seed resolves after unmount", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    let resolveLoad!: (value: string) => void;
    const gate = new Promise<string>((resolve) => {
      resolveLoad = resolve;
    });
    const lines: ComponentEntry[] = [
      {
        key: "root",
        component: "Box",
        seed: [{ set: "scopes.root.data", expr: "loadData()" }],
        props: { expr: "({ text: scopes.root.data })" },
      },
    ];
    const functions: StandardToolV0[] = [
      { name: "loadData", description: "", execute: () => gate },
    ];
    const evaluator = new Evaluator({ functions });

    let unmount!: () => void;
    await act(async () => {
      ({ unmount } = render(
        <RendererProvider implementations={defaultImplementationsList} evaluator={evaluator}><EntriesRenderer entries={lines} /></RendererProvider>,
      ));
    });
    unmount();

    await act(async () => {
      resolveLoad("late");
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  // vitest also fails the run on an unhandled rejection.
  it("stays silent when an async seed rejects after unmount", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    let rejectLoad!: (err: Error) => void;
    const gate = new Promise<string>((_resolve, reject) => {
      rejectLoad = reject;
    });
    const lines: ComponentEntry[] = [
      {
        key: "root",
        component: "Box",
        seed: [{ set: "scopes.root.data", expr: "loadData()" }],
        props: { expr: "({ text: scopes.root.data })" },
      },
    ];
    const functions: StandardToolV0[] = [
      { name: "loadData", description: "", execute: () => gate },
    ];
    const evaluator = new Evaluator({ functions });

    let unmount!: () => void;
    await act(async () => {
      ({ unmount } = render(
        <RendererProvider implementations={defaultImplementationsList} evaluator={evaluator}><EntriesRenderer entries={lines} /></RendererProvider>,
      ));
    });
    unmount();

    await act(async () => {
      rejectLoad(new Error("LATE_FAIL"));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
