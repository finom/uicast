import { act, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ComponentEntry } from "@uicast/core";
import { mountEntries } from "../../../test/render-helpers";

describe("EntryRenderer — whole-scope reads", () => {
  it("Object.keys(scopes.root) re-renders on a write to any root field", () => {
    const lines: ComponentEntry[] = [
      { key: "root", component: "Box", props: { expr: "({ text: Object.keys(scopes.root).length })" } },
    ];
    const { container, scopes } = mountEntries(lines, { rootScope: { a: 1 } });
    expect(container.textContent).toBe("1");
    act(() => scopes.root.$set("b", 2));
    expect(container.textContent).toBe("2");
  });

  it("a bare row read re-renders on a row write", async () => {
    const lines: ComponentEntry[] = [
      { key: "root", component: "Box", children: ["rows"] },
      {
        key: "rows",
        component: "Button",
        as: "row",
        each: "scopes.root.items",
        keyBy: "id",
        props: { expr: "({ label: Object.keys(scopes.row).join(',') })" },
        callbacks: { onClick: [{ set: "scopes.row.extra", literal: 1 }] },
      },
    ];
    const { container, getByText } = mountEntries(lines, { rootScope: { items: [{ id: 1 }] } });
    expect(container.textContent).toBe("id");
    await act(async () => {
      fireEvent.click(getByText("id"));
    });
    await waitFor(() => expect(container.textContent).toBe("id,extra"));
  });
});
