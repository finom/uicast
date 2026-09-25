import { testEvaluator } from "../../../test/render-helpers";
import { act, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { createComponentDefinition, type ComponentEntry } from "@uicast/core";
import { createComponentImplementation, EntriesRenderer, RendererProvider } from "@uicast/react";

const boxDef = createComponentDefinition({
  name: "Box",
  description: "A div that counts its renders.",
  props: z.object({ text: z.string().optional() }),
});

function countingSetup() {
  const counts: Record<string, number> = {};
  const impl = createComponentImplementation({
    def: boxDef,
    render: ({ text, children }, { entry }) => {
      counts[entry.key] = (counts[entry.key] ?? 0) + 1;
      if (counts[entry.key] > 50) throw new Error(`runaway render loop on "${entry.key}"`);
      return (
        <div data-key={entry.key}>
          {text}
          {children}
        </div>
      );
    },
  });
  return { catalog: [impl], counts };
}

describe("EntriesRenderer — feedback loops", () => {
  it("settles when a parent aggregates over the list it contains", async () => {
    const { catalog, counts } = countingSetup();
    const entries: ComponentEntry[] = [
      {
        key: "card",
        component: "Box",
        seed: [{ set: "scopes.root.rows", literal: [{ n: 1 }, { n: 2 }] }],
        props: {
          expr: "({ text: 'sum:' + scopes.root.rows.reduce((a, r) => a + r.n, 0) })",
        },
        children: ["rows"],
      },
      {
        key: "rows",
        component: "Box",
        each: "scopes.root.rows",
        as: "row",
        props: { expr: "({ text: String(scopes.row.n) })" },
      },
    ];

    const { container } = render(
      <RendererProvider evaluator={testEvaluator} implementations={catalog}>
        <EntriesRenderer entries={entries} />
      </RendererProvider>,
    );
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(container.textContent).toContain("sum:3");
    expect(counts.card).toBeLessThan(10);
  });

  // A root is a key no `children` array names, so a closed cycle has none and nothing mounts.
  it("renders nothing for a children cycle instead of recursing", () => {
    const { catalog } = countingSetup();
    const entries: ComponentEntry[] = [
      { key: "a", component: "Box", children: ["b"] },
      { key: "b", component: "Box", children: ["a"] },
    ];

    const { container } = render(
      <RendererProvider evaluator={testEvaluator} implementations={catalog}>
        <EntriesRenderer entries={entries} />
      </RendererProvider>,
    );
    expect(container.textContent).toBe("");
  });

  it("renders nothing for an entry that references itself", () => {
    const { catalog } = countingSetup();
    const entries: ComponentEntry[] = [{ key: "a", component: "Box", children: ["a"] }];

    const { container } = render(
      <RendererProvider evaluator={testEvaluator} implementations={catalog}>
        <EntriesRenderer entries={entries} />
      </RendererProvider>,
    );
    expect(container.textContent).toBe("");
  });
});
