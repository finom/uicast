import { act, fireEvent } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { standardTool } from "standard-tool";
import type { ComponentEntry } from "@uicast/core";
import { CALLBACK_DEBOUNCE_MS } from "@uicast/core/internal";
import { mountEntries } from "../../../test/render-helpers";

// A button whose click writes `q` at once and fetches debounced.
const lines: ComponentEntry[] = [
  { key: "root", component: "Box", children: ["btn", "label"] },
  {
    key: "btn",
    component: "Button",
    props: { expr: "({ label: 'type' })" },
    callbacks: {
      onClick: [
        { set: "scopes.root.q", expr: "currentValue + 'x'" },
        { set: "scopes.root.rows", expr: "search({ q: scopes.root.q })", debounce: true },
      ],
    },
  },
  { key: "label", component: "Box", props: { expr: "({ text: scopes.root.q + '/' + scopes.root.rows })" } },
];

function setup() {
  const calls: string[] = [];
  const search = standardTool({
    name: "search",
    description: "Records the query.",
    inputSchema: z.object({ q: z.string() }),
    outputSchema: z.string(),
    execute: ({ q }) => {
      calls.push(q);
      return `rows:${q}`;
    },
  });
  const mounted = mountEntries(lines, { rootScope: { q: "", rows: "none" }, functions: [search] });
  const btn = mounted.container.querySelector("button[data-key='btn']") as HTMLButtonElement;
  return { ...mounted, calls, btn };
}

describe("EntryRenderer — debounced callback steps", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("runs the steps before `debounce` at once and the rest once, after the quiet time, with the latest state", async () => {
    const { container, calls, btn } = setup();
    // Each click lands before the next, as keystrokes do; the timer never elapses between them.
    for (let i = 0; i < 3; i++) {
      await act(async () => {
        fireEvent.click(btn);
      });
    }
    expect(container.textContent).toContain("xxx/none");
    expect(calls).toEqual([]);

    await act(async () => {
      vi.advanceTimersByTime(CALLBACK_DEBOUNCE_MS - 1);
    });
    expect(calls).toEqual([]);
    await act(async () => {
      vi.advanceTimersByTime(1);
    });
    expect(calls).toEqual(["xxx"]);
    expect(container.textContent).toContain("xxx/rows:xxx");
  });

  it("unmounting cancels a pending run", async () => {
    const { calls, btn, unmount } = setup();
    await act(async () => {
      fireEvent.click(btn);
    });
    unmount();
    await act(async () => {
      vi.advanceTimersByTime(CALLBACK_DEBOUNCE_MS * 2);
    });
    expect(calls).toEqual([]);
  });
});
