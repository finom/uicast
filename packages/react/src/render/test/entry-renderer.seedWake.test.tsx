import { waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ComponentEntry } from "@uicast/core";
import { mountEntries } from "../../../test/render-helpers";

// Own file: React warns "Cannot update a component while rendering…" once per component pair
// per React instance, so an earlier test in the same file would swallow it.
describe("EntryRenderer — a seed streamed in after its readers", () => {
  it("wakes them after its render, not during it", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const lines: ComponentEntry[] = [
      { key: "root", component: "Box", children: ["reader"] },
      { key: "reader", component: "Box", props: { expr: "({ text: String(scopes.root.n ?? 'none') })" } },
    ];
    const { container, emit } = mountEntries(lines, { rootScope: {} });
    expect(container.textContent).toBe("none");
    emit(
      { key: "root", component: "Box", children: ["reader", "seeder"] },
      { key: "seeder", component: "Box", seed: [{ set: "scopes.root.n", literal: 1 }], props: { literal: { text: "s" } } },
    );
    await waitFor(() => expect(container.textContent).toBe("1s"));
    const warnings = consoleError.mock.calls.map((c) => String(c[0])).filter((m) => m.includes("Cannot update a component"));
    consoleError.mockRestore();
    expect(warnings).toEqual([]);
  });
});
