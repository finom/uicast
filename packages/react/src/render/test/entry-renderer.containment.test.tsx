import { describe, expect, it, vi } from "vitest";
import { act, render, waitFor } from "@testing-library/react";
import { EntriesRenderer, RendererProvider } from "@uicast/react";
import type { ComponentEntry } from "@uicast/core";
import type { StandardToolV0 } from "standard-tool";
import {
  defaultImplementationsList,
  mountEntries, testEvaluator } from "../../../test/render-helpers";

const errorSlot = {
  error: ({ error, elementKey }: { error: Error; elementKey?: string }) => (
    <div data-error-for={elementKey}>
      {elementKey} failed: {error.message}
    </div>
  ),
};

describe("EntryRenderer — containment edges", () => {
  it("a bare whole-scope read renders fine and does not latch the parent", () => {
    const lines: ComponentEntry[] = [
      {
        key: "root",
        component: "Box",
        props: { expr: "({ text: 'parent-alive' })" },
        children: ["reader"],
      },
      {
        key: "reader",
        component: "Box",
        props: { expr: "({ text: 'keys:' + Object.keys(scopes.root).length })" },
      },
    ];
    const { container } = mountEntries(lines, { fallbackComponents: errorSlot });
    expect(container.textContent).toContain("parent-alive");
    expect(container.textContent).toContain("keys:");
    expect(container.textContent).not.toContain("failed:");
  });

  it("recovers when the Suspense fallback throws against pre-seed state and the seed then lands", async () => {
    let release: (rows: string[]) => void = () => {};
    const gate = new Promise<string[]>((resolve) => {
      release = resolve;
    });
    const functions: StandardToolV0[] = [
      { name: "fetchRows", description: "", execute: () => gate },
    ];
    const lines: ComponentEntry[] = [
      { key: "root", component: "Box", children: ["widget"] },
      {
        key: "widget",
        component: "Box",
        seed: [{ set: "scopes.root.rows", expr: "fetchRows()" }],
        props: { expr: "({ text: 'first:' + scopes.root.rows[0] })" },
      },
    ];
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    let container!: HTMLElement;
    await act(async () => {
      ({ container } = mountEntries(lines, {
        functions,
        fallbackComponents: errorSlot,
      }));
    });
    await waitFor(() => {
      expect(container.textContent).toContain("widget failed:");
    });

    await act(async () => {
      release(["ready"]);
    });
    await waitFor(() => {
      expect(container.textContent).toContain("first:ready");
    });
    expect(container.textContent).not.toContain("widget failed:");
    consoleError.mockRestore();
  });

  it("attempts a failed host `init` once, not once per stream tick", async () => {
    const init = vi.fn(async () => {
      throw new Error("INIT_FAIL");
    });
    const initialLines: ComponentEntry[] = [
      {
        key: "a",
        component: "Box",
        props: { literal: { text: "hello" } },
        children: ["b", "c"],
      },
    ];
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    let view!: ReturnType<typeof render>;
    await act(async () => {
      view = render(
        <RendererProvider evaluator={testEvaluator} implementations={defaultImplementationsList} init={init}><EntriesRenderer entries={initialLines} /></RendererProvider>,
      );
    });
    await waitFor(() => {
      expect(init).toHaveBeenCalledTimes(1);
    });
    const emit = async (...more: ComponentEntry[]) => {
      initialLines.push(...more);
      await act(async () => {
        view.rerender(
          <RendererProvider evaluator={testEvaluator} implementations={defaultImplementationsList} init={init}><EntriesRenderer entries={[...initialLines]} /></RendererProvider>,
        );
      });
    };
    await emit({ key: "b", component: "Box", props: { literal: { text: "x1" } } });
    await emit({ key: "c", component: "Box", props: { literal: { text: "x2" } } });
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(init).toHaveBeenCalledTimes(1);
    consoleError.mockRestore();
  });
});
