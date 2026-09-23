import { describe, expect, it } from "vitest";
import type { ComponentEntry } from "@uicast/core";
import { mountEntries } from "../../../test/render-helpers";

describe("EntryRenderer — children", () => {
  it("renders children in declared order", () => {
    const lines: ComponentEntry[] = [
      {
        key: "root",
        component: "Box",
        children: ["a", "b", "c"],
      },
      {
        key: "a",
        component: "Box",
        props: { expr: "({ text: 'first' })" },
      },
      {
        key: "b",
        component: "Box",
        props: { expr: "({ text: 'second' })" },
      },
      {
        key: "c",
        component: "Box",
        props: { expr: "({ text: 'third' })" },
      },
    ];
    const { container } = mountEntries(lines);
    const text = container.textContent ?? "";
    expect(text.indexOf("first")).toBeLessThan(text.indexOf("second"));
    expect(text.indexOf("second")).toBeLessThan(text.indexOf("third"));
  });

  it("preserves props-supplied text when children is an empty array", () => {
    const lines: ComponentEntry[] = [
      {
        key: "root",
        component: "Box",
        children: [],
        props: { expr: "({ text: 'from-props' })" },
      },
    ];
    const { container } = mountEntries(lines);
    expect(container.textContent).toContain("from-props");
  });

  it("treats a missing children field as no children (leaf entry)", () => {
    const lines: ComponentEntry[] = [
      {
        key: "root",
        component: "Box",
        props: { expr: "({ text: 'just-me' })" },
      },
    ];
    const { container } = mountEntries(lines);
    expect(container.textContent).toContain("just-me");
  });
});
