import type { ErrorComponentProps } from "@uicast/react";
import { describe, expect, it, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import type { ComponentEntry, EntryError } from "@uicast/core";
import { EntriesRenderer, RendererProvider } from "@uicast/react";
import { defaultImplementationsList, mountEntries, testEvaluator } from "../../../test/render-helpers";

const errorSlot = {
  error: ({ error }: ErrorComponentProps) => (
    <div data-error-for={error.elementKey}>
      {error.elementKey} failed: {error.message}
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

  it("renders a key listed under two parents once, under the first", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const seen: EntryError[] = [];
    const lines: ComponentEntry[] = [
      { key: "root", component: "Box", children: ["a", "b"] },
      { key: "a", component: "Box", children: ["x"] },
      { key: "b", component: "Box", children: ["x"] },
      { key: "x", component: "Box", props: { literal: { text: "X" } } },
    ];
    const { container } = mountEntries(lines, { fallbackComponents: errorSlot, onError: (e) => seen.push(e) });
    expect(container.querySelectorAll('[data-key="x"]')).toHaveLength(1);
    expect(container.querySelector('[data-key="a"] [data-key="x"]')).not.toBeNull();
    expect(container.querySelector('[data-error-for="x"]')?.textContent).toContain("listed in children once");
    expect(seen.map((e) => e.reason)).toContain("guardrail-violation");
    consoleError.mockRestore();
  });

  it("moves a key to its new parent without a stuck error, in either line order", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const page: ComponentEntry[] = [
      { key: "page", component: "Box", children: ["title", "table"] },
      { key: "title", component: "Box", props: { literal: { text: "T" } } },
      { key: "table", component: "Box", props: { literal: { text: "rows" } } },
    ];
    const edit: ComponentEntry[] = [
      { key: "page", component: "Box", children: ["title", "card"] },
      { key: "card", component: "Box", children: ["table"] },
    ];
    for (const lines of [edit, edit.toReversed()]) {
      const { container, emit, unmount } = mountEntries(page, { fallbackComponents: errorSlot });
      for (const line of lines) emit(line);
      expect(container.querySelectorAll('[data-key="table"]')).toHaveLength(1);
      expect(container.querySelector('[data-key="card"] [data-key="table"]')).not.toBeNull();
      expect(container.querySelector("[data-error-for]")).toBeNull();
      unmount();
    }
    consoleError.mockRestore();
  });

  it("renders a key listed twice by one parent once", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const lines: ComponentEntry[] = [
      { key: "root", component: "Box", children: ["x", "x"] },
      { key: "x", component: "Box", props: { literal: { text: "X" } } },
    ];
    const { container } = mountEntries(lines, { fallbackComponents: errorSlot });
    expect(container.querySelectorAll('[data-key="x"]')).toHaveLength(1);
    consoleError.mockRestore();
  });

  // Each level lists the next one twice: without the rule the leaf renders 2^depth times.
  it("does not multiply a subtree listed repeatedly", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const depth = 16;
    const lines: ComponentEntry[] = [{ key: "root", component: "Box", children: [`l${depth}`] }];
    for (let i = depth; i > 0; i--)
      lines.push({ key: `l${i}`, component: "Box", children: [`l${i - 1}`, `l${i - 1}`] });
    lines.push({ key: "l0", component: "Box", props: { literal: { text: "leaf" } } });
    const { container } = mountEntries(lines, { fallbackComponents: errorSlot });
    expect(container.querySelectorAll('[data-key="l0"]')).toHaveLength(1);
    consoleError.mockRestore();
  });

  // Each row costs a few ms: without the shared cap the whole list runs, however long it takes.
  it("stops an update whose expressions together run past the time budget", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const seen: EntryError[] = [];
    const burn = "Array.from({ length: 60000 }, (_, i) => i).reduce((a, b) => a + b, 0)";
    const lines: ComponentEntry[] = [
      { key: "root", component: "Box", children: ["rows"] },
      {
        key: "rows",
        component: "Box",
        each: "Array.from({ length: 3000 }, (_, i) => i)",
        as: "r",
        props: { expr: `({ text: String(${burn}) })` },
      },
    ];
    const start = performance.now();
    const { container } = mountEntries(lines, { fallbackComponents: errorSlot, onError: (e) => seen.push(e) });
    expect(performance.now() - start).toBeLessThan(5_000);
    expect(container.querySelector('[data-error-for="rows"]')?.textContent).toContain("in one update");
    expect(seen.some((e) => e.reason === "budget-exceeded")).toBe(true);
    consoleError.mockRestore();
  });

  it("gives the next update a fresh time budget", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const burn = "Array.from({ length: 60000 }, (_, i) => i).reduce((a, b) => a + b, 0)";
    mountEntries(
      [
        { key: "root", component: "Box", children: ["rows"] },
        {
          key: "rows",
          component: "Box",
          each: "Array.from({ length: 3000 }, (_, i) => i)",
          as: "r",
          props: { expr: `({ text: String(${burn}) })` },
        },
      ],
      { fallbackComponents: errorSlot },
    );
    await Promise.resolve();
    const { container } = mountEntries([{ key: "root", component: "Box", props: { expr: "({ text: 'fresh' })" } }]);
    expect(container.textContent).toBe("fresh");
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
        props: { expr: "({ text: scopes.$row.value })" },
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
      <RendererProvider
        evaluator={testEvaluator}
        implementations={defaultImplementationsList}
        fallbackComponents={errorSlot}
      >
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
        props: { expr: "({ text: 'id:' + scopes.$row.id + ';' })" },
      },
    ];
    const { container } = mountEntries(lines, {
      rootScope: { items: [{ n: 1 }] },
      fallbackComponents: { ...errorSlot, defaultSkeleton: () => <span>pending</span> },
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
