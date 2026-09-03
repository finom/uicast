import { describe, expect, it, vi } from "vitest";
import type { ComponentEntry, EntryError } from "@uicast/core";
import { mountEntries } from "../../../test/render-helpers";

describe("EntryRenderer — a re-emitted list", () => {
  it("gives its rows the new `as` name", () => {
    const seen: EntryError[] = [];
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const lines: ComponentEntry[] = [
      { key: "root", component: "Box", children: ["rows"] },
      { key: "rows", component: "Box", as: "row", each: "scopes.root.items", keyBy: "id", children: ["cell"] },
      { key: "cell", component: "Box", props: { expr: "({ text: scopes.row.name + ';' })" } },
    ];
    const { container, emit } = mountEntries(lines, {
      rootScope: { items: [{ id: 1, name: "Ada" }] },
      onError: (e) => seen.push(e),
    });
    expect(container.textContent).toBe("Ada;");
    emit(
      { key: "rows", component: "Box", as: "item", each: "scopes.root.items", keyBy: "id", children: ["cell"] },
      { key: "cell", component: "Box", props: { expr: "({ text: scopes.item.name + '!' })" } },
    );
    consoleError.mockRestore();
    expect(seen).toEqual([]);
    expect(container.textContent).toBe("Ada!");
  });
});
