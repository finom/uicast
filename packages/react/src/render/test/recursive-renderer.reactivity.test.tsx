import { act } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ComponentEntry } from "@ui-fired/core";
import { mountEntries } from "../../../test/render-helpers";

describe("RecursiveRenderer — fine-grained reactivity", () => {
  it("only entries subscribed to the changed path re-render", () => {
    // Two siblings reading different scope paths. We exercise this by
    // observing rendered output — after writing to `b`, the entry reading
    // `a` keeps its old text and the entry reading `b` updates.
    const lines: ComponentEntry[] = [
      {
        key: "root",
        component: "Box",
        children: ["readA", "readB"],
      },
      {
        key: "readA",
        component: "Box",
        props: { expr: "({ text: scopes.root.a })" },
      },
      {
        key: "readB",
        component: "Box",
        props: { expr: "({ text: scopes.root.b })" },
      },
    ];
    const { container, scopes } = mountEntries(lines, {
      rootScope: { a: "AAA", b: "BBB" },
    });
    expect(container.textContent).toContain("AAA");
    expect(container.textContent).toContain("BBB");

    act(() => {
      scopes.root.$set("b", "B-updated");
    });
    expect(container.textContent).toContain("AAA");
    expect(container.textContent).toContain("B-updated");
  });

  it("expression-evaluation runs against the latest state on every wake", () => {
    const lines: ComponentEntry[] = [
      {
        key: "root",
        component: "Box",
        props: { expr: "({ text: scopes.root.count * 10 })" },
      },
    ];
    const { container, scopes } = mountEntries(lines, {
      rootScope: { count: 1 },
    });
    expect(container.textContent).toContain("10");

    act(() => {
      scopes.root.$set("count", 7);
    });
    expect(container.textContent).toContain("70");
  });
});
