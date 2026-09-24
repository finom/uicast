import type { ErrorComponentProps } from "@uicast/react";
import { describe, expect, it, vi } from "vitest";
import { act, render, waitFor } from "@testing-library/react";
import { EntriesRenderer, RendererProvider } from "@uicast/react";
import type { ComponentEntry } from "@uicast/core";
import {
  defaultImplementationsList,
  mountEntries, testEvaluator } from "../../../test/render-helpers";

const errorSlot = {
  error: ({ error }: ErrorComponentProps) => (
    <div data-error-for={error.elementKey}>
      {error.elementKey} failed: {error.message}
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
