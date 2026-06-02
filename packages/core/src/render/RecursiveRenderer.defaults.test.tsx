import { act, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ChunkComponent } from "ui-fired/core/types";
import { mountChunks } from "../../test/renderHelpers";

describe("RecursiveRenderer — defaults", () => {
  it("seeds root scope at mount via literal", () => {
    const lines: ChunkComponent[] = [
      {
        key: "root",
        component: "Box",
        op: "root",
        kind: "element",
        defaults: [{ set: "scopes.root.count", literal: 5 }],
        props: { expr: "({ text: scopes.root.count })" },
      },
    ];
    const { container, scopes } = mountChunks(lines);
    expect((scopes.root as Record<string, unknown>).count).toBe(5);
    expect(container.textContent).toContain("5");
  });

  it("seeds via expression", () => {
    const lines: ChunkComponent[] = [
      {
        key: "root",
        component: "Box",
        op: "root",
        kind: "element",
        defaults: [{ set: "scopes.root.total", expr: "2 + 2" }],
        props: { expr: "({ text: scopes.root.total })" },
      },
    ];
    const { container } = mountChunks(lines);
    expect(container.textContent).toContain("4");
  });

  it("runs each default exactly once on mount", () => {
    let count = 0;
    const lines: ChunkComponent[] = [
      {
        key: "root",
        component: "Box",
        op: "root",
        kind: "element",
        defaults: [{ set: "scopes.root.x", expr: "track()" }],
        props: { expr: "({ text: scopes.root.x })" },
      },
    ];
    const { container, scopes } = mountChunks(lines, {
      functions: {
        track: () => {
          count += 1;
          return count;
        },
      },
    });
    expect(count).toBe(1);

    // Re-render via state change — defaults must NOT fire again.
    act(() => {
      scopes.root.$set("other", "force-rerender");
    });
    expect(count).toBe(1);
    expect(container.textContent).toContain("1");
  });

  it("supports async defaults via Suspense (use(promise))", async () => {
    const lines: ChunkComponent[] = [
      {
        key: "root",
        component: "Box",
        op: "root",
        kind: "element",
        defaults: [{ set: "scopes.root.data", expr: "loadData()" }],
        props: { expr: "({ text: scopes.root.data })" },
      },
    ];
    const { container } = mountChunks(lines, {
      functions: {
        loadData: async () => "loaded-value",
      },
    });
    await waitFor(() => {
      expect(container.textContent).toContain("loaded-value");
    });
  });
});
