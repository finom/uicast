import { describe, expect, it } from "vitest";
import React, { StrictMode } from "react";
import { act, render } from "@testing-library/react";
import { z } from "zod";
import { createAIComponentDef } from "@ui-fired/core/render/createAIComponentDef";
import {
  createAIComponentRenderer,
  createAIComponentRenderers,
} from "@ui-fired/react";
import type { Fired } from "@ui-fired/core/types";
import type { InitFn } from "@ui-fired/react";

// ---------------------------------------------------------------------------
// Render-once guarantee.
//
// The reactivity model promises that a *settled* chunk renders exactly once and
// is not re-rendered when an UNRELATED chunk streams in later, or when an
// ancestor re-renders for its own reasons. (Under React StrictMode in dev,
// every render is intentionally double-invoked, so the cap there is 2.)
//
// These tests pin that contract. Before the per-node subscription refactor a
// settled leaf re-rendered once per streaming tick (the "storm"): a leaf that
// appeared on tick 2 of a 5-tick reveal rendered 4 times. The assertions below
// would have read 4, not 1.
// ---------------------------------------------------------------------------

const boxDef = createAIComponentDef({
  name: "Box",
  description: "A plain div that records each render keyed by chunk id.",
  props: z.object({ text: z.string().optional() }),
});

/** Fresh renderer factory + a per-chunk render-count map, isolated per test. */
function countingSetup() {
  const counts: Record<string, number> = {};
  const boxRenderer = createAIComponentRenderer({
    def: boxDef,
    renderer: ({ text, children, generatedKey }) => {
      counts[generatedKey] = (counts[generatedKey] ?? 0) + 1;
      return (
        <div data-key={generatedKey}>
          {text}
          {children}
        </div>
      );
    },
  });
  const { Renderer } = createAIComponentRenderers([boxRenderer]);
  return { Renderer, counts };
}

// A root whose children are all declared up-front, revealed one chunk per tick
// (the slice() simulates the streaming JSONLines reveal `<Renderer>` is fed).
const REVEAL: Fired.Element[] = [
  { key: "root", component: "Box", children: ["a", "b", "c", "d"] },
  { key: "a", component: "Box", props: { expr: "({ text: 'A' })" } },
  { key: "b", component: "Box", props: { expr: "({ text: 'B' })" } },
  { key: "c", component: "Box", props: { expr: "({ text: 'C' })" } },
  { key: "d", component: "Box", props: { expr: "({ text: 'D' })" } },
];

function streamReveal(Renderer: ReturnType<typeof countingSetup>["Renderer"]) {
  const { rerender } = render(<Renderer lines={REVEAL.slice(0, 1)} />);
  for (let i = 2; i <= REVEAL.length; i++) {
    rerender(<Renderer lines={REVEAL.slice(0, i)} />);
  }
}

describe("RecursiveRenderer — render-once during streaming", () => {
  it("renders every settled chunk EXACTLY once across the whole reveal", () => {
    const { Renderer, counts } = countingSetup();
    streamReveal(Renderer);

    // Each leaf mounts on the tick it streams in and is never re-rendered as
    // its siblings arrive afterwards.
    expect(counts.a).toBe(1);
    expect(counts.b).toBe(1);
    expect(counts.c).toBe(1);
    expect(counts.d).toBe(1);
    // The container, too: its element identity never changes, so it renders
    // once and bails on every subsequent tick.
    expect(counts.root).toBe(1);
  });

  it("allows at most 2 renders per chunk under React StrictMode (dev double-invoke)", () => {
    const { Renderer, counts } = countingSetup();
    const { rerender } = render(
      <StrictMode>
        <Renderer lines={REVEAL.slice(0, 1)} />
      </StrictMode>,
    );
    for (let i = 2; i <= REVEAL.length; i++) {
      rerender(
        <StrictMode>
          <Renderer lines={REVEAL.slice(0, i)} />
        </StrictMode>,
      );
    }

    for (const key of ["root", "a", "b", "c", "d"]) {
      expect(counts[key], `chunk ${key}`).toBeGreaterThanOrEqual(1);
      expect(counts[key], `chunk ${key}`).toBeLessThanOrEqual(2);
    }
  });
});

describe("RecursiveRenderer — render-once on state change", () => {
  it("a parent re-rendering on its own state change does NOT cascade to a child", () => {
    const counts: Record<string, number> = {};
    const boxRenderer = createAIComponentRenderer({
      def: boxDef,
      renderer: ({ text, children, generatedKey }) => {
        counts[generatedKey] = (counts[generatedKey] ?? 0) + 1;
        return (
          <div data-key={generatedKey}>
            {text}
            {children}
          </div>
        );
      },
    });
    const { Renderer } = createAIComponentRenderers([boxRenderer]);

    // Parent reads scopes.root.label; child reads nothing.
    const lines: Fired.Element[] = [
      {
        key: "root",
        component: "Box",
        children: ["child"],
        props: { expr: "({ text: scopes.root.label })" },
      },
      { key: "child", component: "Box", props: { expr: "({ text: 'static' })" } },
    ];

    let captured: Parameters<InitFn>[0]["scopes"] | undefined;
    const init: InitFn = ({ scopes }) => {
      (scopes.root as Record<string, unknown>).label = "init";
      captured = scopes;
    };

    render(<Renderer lines={lines} init={init} />);
    expect(counts.root).toBe(1);
    expect(counts.child).toBe(1);

    // Mutate only the path the PARENT reads.
    act(() => {
      (captured as Record<string, Record<string, unknown>>).root.label =
        "changed";
    });

    // Parent re-rendered (it reads `label`); the child did not — the memo bails
    // the parent→child cascade that existed before the refactor.
    expect(counts.root).toBe(2);
    expect(counts.child).toBe(1);
  });
});
