import { act } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ChunkComponent } from "@ui-fired/core/types";
import { mountChunks } from "../../../test/renderHelpers";

describe("RecursiveRenderer — scopes", () => {
  it("reads from the root scope on mount", () => {
    const lines: ChunkComponent[] = [
      {
        key: "root",
        component: "Box",
        props: { expr: "({ text: scopes.root.label })" },
      },
    ];
    const { container } = mountChunks(lines, {
      rootScope: { label: "hello" },
    });
    expect(container.textContent).toContain("hello");
  });

  it("re-evaluates props when a subscribed scope path changes", () => {
    const lines: ChunkComponent[] = [
      {
        key: "root",
        component: "Box",
        props: { expr: "({ text: scopes.root.count })" },
      },
    ];
    const { container, scopes } = mountChunks(lines, {
      rootScope: { count: 0 },
    });
    expect(container.textContent).toContain("0");

    act(() => {
      scopes.root.$set("count", 7);
    });
    expect(container.textContent).toContain("7");
  });

  it("does not wake on unrelated path writes (path-exact subscription)", () => {
    const lines: ChunkComponent[] = [
      {
        key: "root",
        component: "Box",
        props: { expr: "({ text: scopes.root.a })" },
      },
    ];
    const { container, scopes } = mountChunks(lines, {
      rootScope: { a: "first", b: "ignored" },
    });
    expect(container.textContent).toContain("first");

    // Write to a sibling path; the renderer shouldn't re-render because the
    // chunk doesn't read `b`.
    act(() => {
      scopes.root.$set("b", "still-ignored");
    });
    expect(container.textContent).toContain("first");
  });

  it("reads from a non-root scope when one is wired in", () => {
    const lines: ChunkComponent[] = [
      {
        key: "root",
        component: "Box",
        props: { expr: "({ text: scopes.userCtx.name })" },
      },
    ];
    const { container } = mountChunks(lines, {
      rootScope: {},
      scopes: { userCtx: { name: "Hopper" } },
    });
    expect(container.textContent).toContain("Hopper");
  });

  it("propagates root-scope state down to nested children", () => {
    const lines: ChunkComponent[] = [
      {
        key: "root",
        component: "Box",
        children: ["child"],
      },
      {
        key: "child",
        component: "Box",
        props: { expr: "({ text: scopes.root.shared })" },
      },
    ];
    const { container, scopes } = mountChunks(lines, {
      rootScope: { shared: "from-root" },
    });
    expect(container.textContent).toContain("from-root");

    act(() => {
      scopes.root.$set("shared", "updated");
    });
    expect(container.textContent).toContain("updated");
  });
});
