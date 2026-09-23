import { describe, expect, it, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import type { ComponentEntry, EntryError } from "@uicast/core";
import { EntriesRenderer, RendererProvider } from "@uicast/react";
import { defaultImplementationsList, mountEntries, testEvaluator } from "../../../test/render-helpers";

const errorSlot = {
  error: ({ error, elementKey }: { error: Error; elementKey?: string }) => (
    <div data-error-for={elementKey}>
      {elementKey} failed: {error.message}
    </div>
  ),
};

describe("EntryRenderer — document faults that must not crash", () => {
  it("refuses a reachable children cycle instead of recursing", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const lines: ComponentEntry[] = [
      { key: "root", component: "Box", children: ["a"] },
      { key: "a", component: "Box", children: ["b"] },
      { key: "b", component: "Box", children: ["a"] },
    ];
    const { container } = mountEntries(lines, { fallbackComponents: errorSlot });
    expect(container.textContent).toContain("failed:");
    expect(container.textContent).toContain("cycle");
    consoleError.mockRestore();
  });

  it("still renders a list whose rows carry the list's own key", () => {
    const lines: ComponentEntry[] = [
      { key: "root", component: "Box", children: ["rows"] },
      {
        key: "rows",
        component: "Box",
        each: "scopes.root.items",
        as: "row",
        props: { expr: "({ text: scopes.row.$value })" },
      },
    ];
    const { container } = mountEntries(lines, { rootScope: { items: ["one", "two"] } });
    expect(container.textContent).toContain("one");
    expect(container.textContent).toContain("two");
  });

  it("classifies a write to a scope that does not exist", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const lines: ComponentEntry[] = [
      { key: "root", component: "Box", children: ["seeder"] },
      {
        key: "seeder",
        component: "Box",
        seed: [{ set: "scopes.nope.x", literal: 1 }],
        props: { expr: "({ text: 'seeded' })" },
      },
    ];
    const { container } = mountEntries(lines, { fallbackComponents: errorSlot });
    await waitFor(() => {
      expect(container.textContent).toContain("seeder failed:");
    });
    expect(container.textContent).toContain("does not exist");
    consoleError.mockRestore();
  });

  it("finds no component named after an Object.prototype member", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const { container } = render(
      <RendererProvider evaluator={testEvaluator} implementations={defaultImplementationsList} fallbackComponents={errorSlot}>
        <EntriesRenderer
          entries={[
            { key: "root", component: "Box", props: { literal: { text: "parent-alive;" } }, children: ["bad"] },
            { key: "bad", component: "constructor" },
          ]}
        />
      </RendererProvider>,
    );
    expect(container.textContent).toBe("parent-alive;bad failed: Unknown component: constructor");
    consoleError.mockRestore();
  });

  it("finds no scope, element or row id named after an Object.prototype member", () => {
    const lines: ComponentEntry[] = [
      { key: "root", component: "Box", children: ["reader", "rows", "constructor"] },
      { key: "reader", component: "Box", props: { expr: "({ text: 'read:' + scopes.constructor?.x + ';' })" } },
      {
        key: "rows",
        component: "Box",
        each: "scopes.root.items",
        as: "row",
        keyBy: "constructor",
        props: { expr: "({ text: 'id:' + scopes.row.$id + ';' })" },
      },
    ];
    const { container } = mountEntries(lines, {
      rootScope: { items: [{ n: 1 }] },
      fallbackComponents: { ...errorSlot, placeholder: () => <span>pending</span> },
    });
    expect(container.textContent).toBe("read:undefined;id:0;pending");
  });

  it("classifies a write to a scope named after an Object.prototype member", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const seen: EntryError[] = [];
    mountEntries([{ key: "root", component: "Box", seed: [{ set: "scopes.toString.x", literal: 1 }] }], {
      onError: (e) => seen.push(e),
    });
    await waitFor(() => expect(seen[0]?.reason).toBe("unknown-reference"));
    consoleError.mockRestore();
  });
});
