import { act, fireEvent } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { standardTool } from "standard-tool";
import type { ComponentEntry } from "@uicast/core";
import { CALLBACK_DEBOUNCE_MS } from "@uicast/core/internal";
import { mountEntries } from "../../../test/render-helpers";

// A host function whose answers the test releases one by one, in any order.
function deferred(name: string) {
  const pending = new Map<string, (value: string) => void>();
  const tool = standardTool({
    name,
    description: "Answers when released.",
    inputSchema: z.object({ q: z.string() }),
    outputSchema: z.string(),
    execute: ({ q }) => new Promise<string>((resolve) => pending.set(q, () => resolve(`rows:${q}`))),
  });
  const release = (q: string) =>
    act(async () => {
      pending.get(q)?.(q);
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  return { tool, pending, release };
}

const click = (button: HTMLElement) =>
  act(async () => {
    fireEvent.click(button);
  });

describe("EntryRenderer — a newer run of a callback", () => {
  afterEach(() => vi.useRealTimers());

  it("drops an older answer that lands last", async () => {
    const { tool, pending, release } = deferred("fetchPage");
    const lines: ComponentEntry[] = [
      { key: "root", component: "Box", children: ["next", "label"] },
      {
        key: "next",
        component: "Button",
        props: { expr: "({ label: 'next' })" },
        callbacks: {
          onClick: [
            { set: "scopes.root.page", expr: "currentValue + 1" },
            { set: "scopes.root.busy", literal: true },
            { set: "scopes.root.rows", expr: "fetchPage({ q: String(scopes.root.page) })" },
            { set: "scopes.root.busy", literal: false },
          ],
        },
      },
      { key: "label", component: "Box", props: { expr: "({ text: scopes.root.rows + '/' + scopes.root.busy })" } },
    ];
    const { container } = mountEntries(lines, { rootScope: { page: 1, rows: "none", busy: false }, functions: [tool] });
    const next = container.querySelector("button[data-key='next']") as HTMLButtonElement;

    await click(next);
    await click(next);
    expect([...pending.keys()]).toEqual(["2", "3"]);
    await release("3");
    expect(container.textContent).toContain("rows:3/false");
    await release("2");
    expect(container.textContent).toContain("rows:3/false");
  });

  it("drops a debounced search answer a newer query overtook", async () => {
    vi.useFakeTimers();
    const { tool, release } = deferred("search");
    const lines: ComponentEntry[] = [
      { key: "root", component: "Box", children: ["type", "label"] },
      {
        key: "type",
        component: "Button",
        props: { expr: "({ label: 'type' })" },
        callbacks: {
          onClick: [
            { set: "scopes.root.q", expr: "currentValue + 'x'" },
            { set: "scopes.root.rows", expr: "search({ q: scopes.root.q })", debounce: true },
          ],
        },
      },
      { key: "label", component: "Box", props: { expr: "({ text: scopes.root.rows })" } },
    ];
    const { container } = mountEntries(lines, { rootScope: { q: "", rows: "none" }, functions: [tool] });
    const type = container.querySelector("button[data-key='type']") as HTMLButtonElement;

    await click(type);
    await act(async () => vi.advanceTimersByTime(CALLBACK_DEBOUNCE_MS));
    await click(type);
    await act(async () => vi.advanceTimersByTime(CALLBACK_DEBOUNCE_MS));
    vi.useRealTimers();
    await release("xx");
    await release("x");
    expect(container.textContent).toContain("rows:xx");
  });

  it("a declined confirm skips the debounced steps after it", async () => {
    vi.useFakeTimers();
    const original = window.confirm;
    window.confirm = () => false;
    const lines: ComponentEntry[] = [
      {
        key: "root",
        component: "Button",
        props: { expr: "({ label: 'reset' })" },
        callbacks: {
          onClick: [
            { confirm: "Reset?", set: "scopes.root.q", literal: "" },
            { set: "scopes.root.rows", literal: "all", debounce: true },
          ],
        },
      },
    ];
    const { container, scopes } = mountEntries(lines, { rootScope: { q: "x", rows: "some" } });
    await click(container.querySelector("button") as HTMLButtonElement);
    await act(async () => vi.advanceTimersByTime(CALLBACK_DEBOUNCE_MS));
    window.confirm = original;
    expect((scopes.root as Record<string, unknown>).rows).toBe("some");
  });
});
