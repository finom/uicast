import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ComponentEntry } from "@uicast/core";
import { EntriesRenderer, RendererProvider } from "@uicast/react";
import { defaultImplementationsList, mountEntries, testEvaluator } from "../../../test/render-helpers";

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

  it("finds the roots without reading a `children` that is not an array", () => {
    // Iterating a string `children` would count its characters as child keys and hide `a`.
    const lines = [
      { key: "root", component: "Box", children: "a" },
      { key: "a", component: "Box", props: { expr: "({ text: 'own root' })" } },
    ] as unknown as ComponentEntry[];
    const { container } = render(
      <RendererProvider evaluator={testEvaluator} implementations={defaultImplementationsList}>
        <EntriesRenderer entries={lines} />
      </RendererProvider>,
    );
    expect(container.textContent).toContain("own root");
  });
});
