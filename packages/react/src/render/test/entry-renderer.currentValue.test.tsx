import { act, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ComponentEntry } from "uicast";
import { mountEntries } from "../../../test/render-helpers";

// `currentValue` is the value currently at an assignment's `set` path, bound
// into the eval context of every set-bearing seed / callback step so an
// expression can read-modify-write (`currentValue + 1`, `!currentValue`,
// `[...currentValue, x]`) without re-reading the path.
describe("EntryRenderer — currentValue", () => {
  it("binds currentValue in a callback for increments, re-read each click", async () => {
    const lines: ComponentEntry[] = [
      { key: "root", component: "Box", children: ["btn", "label"] },
      {
        key: "btn",
        component: "Button",
        props: { expr: "({ label: 'inc' })" },
        callbacks: {
          onClick: [{ set: "scopes.root.count", expr: "currentValue + 1" }],
        },
      },
      {
        key: "label",
        component: "Box",
        props: { expr: "({ text: scopes.root.count })" },
      },
    ];
    const { container } = mountEntries(lines, { rootScope: { count: 10 } });
    const btn = container.querySelector(
      "button[data-key='btn']",
    ) as HTMLButtonElement;

    await act(async () => {
      fireEvent.click(btn);
    });
    await waitFor(() => expect(container.textContent).toContain("11"));

    // A second click must read the *updated* value, not the mount-time one.
    await act(async () => {
      fireEvent.click(btn);
    });
    await waitFor(() => expect(container.textContent).toContain("12"));
  });

  it("reads currentValue as undefined for a never-set path (first toggle → true)", async () => {
    const lines: ComponentEntry[] = [
      { key: "root", component: "Box", children: ["btn", "label"] },
      {
        key: "btn",
        component: "Button",
        callbacks: {
          onClick: [{ set: "scopes.root.open", expr: "!currentValue" }],
        },
      },
      {
        key: "label",
        component: "Box",
        props: { expr: "({ text: scopes.root.open === true ? 'OPEN' : 'CLOSED' })" },
      },
    ];
    const { container } = mountEntries(lines, { rootScope: {} });
    expect(container.textContent).toContain("CLOSED");

    const btn = container.querySelector("button") as HTMLButtonElement;
    await act(async () => {
      fireEvent.click(btn);
    });
    await waitFor(() => expect(container.textContent).toContain("OPEN"));

    await act(async () => {
      fireEvent.click(btn);
    });
    await waitFor(() => expect(container.textContent).toContain("CLOSED"));
  });

  it("supports read-modify-write on arrays via currentValue (append)", async () => {
    const lines: ComponentEntry[] = [
      { key: "root", component: "Box", children: ["btn", "label"] },
      {
        key: "btn",
        component: "Button",
        callbacks: {
          onClick: [
            { set: "scopes.root.items", expr: "[...currentValue, currentValue.length]" },
          ],
        },
      },
      {
        key: "label",
        component: "Box",
        props: { expr: "({ text: scopes.root.items.join(',') })" },
      },
    ];
    const { container } = mountEntries(lines, { rootScope: { items: [0] } });
    expect(container.textContent).toContain("0");

    const btn = container.querySelector("button") as HTMLButtonElement;
    await act(async () => {
      fireEvent.click(btn);
    });
    await waitFor(() => expect(container.textContent).toContain("0,1"));

    await act(async () => {
      fireEvent.click(btn);
    });
    await waitFor(() => expect(container.textContent).toContain("0,1,2"));
  });

  it("re-reads currentValue between sequential steps writing the same path", async () => {
    const lines: ComponentEntry[] = [
      { key: "root", component: "Box", children: ["btn", "label"] },
      {
        key: "btn",
        component: "Button",
        callbacks: {
          onClick: [
            { set: "scopes.root.count", expr: "currentValue + 1" },
            { set: "scopes.root.count", expr: "currentValue + 10" },
          ],
        },
      },
      {
        key: "label",
        component: "Box",
        props: { expr: "({ text: scopes.root.count })" },
      },
    ];
    const { container } = mountEntries(lines, { rootScope: { count: 0 } });
    const btn = container.querySelector("button") as HTMLButtonElement;

    await act(async () => {
      fireEvent.click(btn);
    });
    // 0 → (+1) → 1 → (+10) → 11: the second step sees the first step's write.
    await waitFor(() => expect(container.textContent).toContain("11"));
  });

  it("binds currentValue in a seed (undefined at first mount)", () => {
    const lines: ComponentEntry[] = [
      {
        key: "root",
        component: "Box",
        seed: [
          {
            set: "scopes.root.flag",
            expr: "currentValue === undefined ? 'fresh' : 'reused'",
          },
        ],
        props: { expr: "({ text: scopes.root.flag })" },
      },
    ];
    const { container } = mountEntries(lines, { rootScope: {} });
    expect(container.textContent).toContain("fresh");
  });
});
