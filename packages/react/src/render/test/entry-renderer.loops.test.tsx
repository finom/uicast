import { act, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { createComponentDefinition, type ComponentEntry } from "@uicast/core";
import {
  createComponentImplementation,
  EntriesRenderer,
  RendererProvider,
} from "@uicast/react";

// ---------------------------------------------------------------------------
// Feedback loops.
//
// The React failure mode this format is meant to rule out: an effect writes
// state it also depends on, so every render schedules the next one. Two shapes
// could still reach it here — a parent reading `childScopes` (republished on
// every list render, always as a fresh array, so the write always emits), and
// an entry tree whose `children` reference each other in a cycle.
// ---------------------------------------------------------------------------

const boxDef = createComponentDefinition({
  name: "Box",
  description: "A div that counts its renders.",
  props: z.object({ text: z.string().optional() }),
});

function countingSetup() {
  const counts: Record<string, number> = {};
  const impl = createComponentImplementation({
    def: boxDef,
    render: ({ text, children, generatedKey }) => {
      counts[generatedKey] = (counts[generatedKey] ?? 0) + 1;
      if (counts[generatedKey] > 50)
        throw new Error(`runaway render loop on "${generatedKey}"`);
      return (
        <div data-key={generatedKey}>
          {text}
          {children}
        </div>
      );
    },
  });
  return { catalog: [impl], counts };
}

describe("EntriesRenderer — feedback loops", () => {
  // A parent whose props aggregate over `childScopes`, wrapping the very list
  // that publishes them. The list republishes on each of its own renders.
  it("settles when a parent aggregates over the list it contains", async () => {
    const { catalog, counts } = countingSetup();
    const entries: ComponentEntry[] = [
      {
        key: "card",
        component: "Box",
        seed: [{ set: "scopes.root.rows", literal: [{ n: 1 }, { n: 2 }] }],
        props: {
          expr: "({ text: 'sum:' + (scopes.root.childScopes?.row ?? []).reduce((a, s) => a + s.item.n, 0) })",
        },
        children: ["rows"],
      },
      {
        key: "rows",
        component: "Box",
        each: "scopes.root.rows",
        as: "row",
        props: { expr: "({ text: String(scopes.row.item.n) })" },
      },
    ];

    const { container } = render(
      <RendererProvider implementations={catalog}>
        <EntriesRenderer entries={entries} />
      </RendererProvider>,
    );
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(container.textContent).toContain("sum:3");
    expect(counts.card).toBeLessThan(10);
  });

  // `a` lists `b` as a child and `b` lists `a` back. Neither can be the root
  // (both appear in a `children` array), so nothing mounts — the cycle is
  // unreachable rather than infinitely deep.
  it("renders nothing for a children cycle instead of recursing", () => {
    const { catalog } = countingSetup();
    const entries: ComponentEntry[] = [
      { key: "a", component: "Box", children: ["b"] },
      { key: "b", component: "Box", children: ["a"] },
    ];

    const { container } = render(
      <RendererProvider implementations={catalog}>
        <EntriesRenderer entries={entries} />
      </RendererProvider>,
    );
    expect(container.textContent).toBe("");
  });

  // A root that lists itself: it IS in a `children` array, so it is not a root.
  it("renders nothing for an entry that references itself", () => {
    const { catalog } = countingSetup();
    const entries: ComponentEntry[] = [
      { key: "a", component: "Box", children: ["a"] },
    ];

    const { container } = render(
      <RendererProvider implementations={catalog}>
        <EntriesRenderer entries={entries} />
      </RendererProvider>,
    );
    expect(container.textContent).toBe("");
  });
});
