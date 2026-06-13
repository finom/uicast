import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createComponentDefinition } from "@ui-fired/core/render/create-component-definition";
import type { ComponentEntry } from "@ui-fired/core/types";
import {
  createComponentImplementation,
  type InitFn,
  Renderer,
} from "@ui-fired/react";
import { z } from "zod";
import { defaultRenderersList } from "../../../test/render-helpers";

// `catalog` is a runtime prop on the standalone <Renderer> — an array of
// renderers, symmetric with `functions`. <Renderer> builds the name→renderer
// lookup itself. These tests pin that prop path directly.
describe("Renderer — catalog prop", () => {
  it("renders a chunk tree from a catalog array passed as a prop (merging Fragment when absent)", () => {
    // `defaultRenderersList` carries no `Fragment` entry, so a successful render
    // also proves <Renderer>'s Fragment merge — without it the synthetic root
    // wrapper would hit the Unknown-component branch and nothing would show.
    const lines: ComponentEntry[] = [
      {
        key: "k1",
        component: "Box",
        props: { expr: "({ text: 'from-catalog-prop' })" },
      },
    ];
    const { container } = render(
      <Renderer implementations={defaultRenderersList} lines={lines} />,
    );
    expect(container.textContent).toContain("from-catalog-prop");
  });

  it("gives each mounted Renderer an isolated root scope", () => {
    // Two Renderers in one tree; each `init` captures its own `scopes.root`.
    // If `root` were shared (module/closure) the two references would be equal —
    // per-instance isolation requires them to differ.
    let rootA: unknown;
    let rootB: unknown;
    const initA: InitFn = ({ scopes }) => {
      rootA = scopes.root;
    };
    const initB: InitFn = ({ scopes }) => {
      rootB = scopes.root;
    };
    const box = (key: string): ComponentEntry[] => [
      { key, component: "Box", props: { expr: "({ text: 'x' })" } },
    ];

    render(
      <>
        <Renderer
          implementations={defaultRenderersList}
          lines={box("rA")}
          init={initA}
        />
        <Renderer
          implementations={defaultRenderersList}
          lines={box("rB")}
          init={initB}
        />
      </>,
    );

    expect(rootA).toBeDefined();
    expect(rootB).toBeDefined();
    expect(rootA).not.toBe(rootB);
  });

  it("on a duplicate component name the later renderer wins and logs an error", () => {
    // Two renderers share the def name "Box". <Renderer> builds its map
    // last-wins (so `[...base, Override]` overrides), logging a console.error so
    // an *accidental* double-registration is still loud.
    const boxDef = createComponentDefinition({
      name: "Box",
      description: "test box",
      props: z.object({}),
    });
    const first = createComponentImplementation({
      def: boxDef,
      render: () => <span>first</span>,
    });
    const second = createComponentImplementation({
      def: boxDef,
      render: () => <span>second</span>,
    });
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const lines: ComponentEntry[] = [{ key: "k", component: "Box" }];
    const { container } = render(
      <Renderer implementations={[first, second]} lines={lines} />,
    );

    // The later renderer wins the name; the earlier one never renders.
    expect(container.textContent).toContain("second");
    expect(container.textContent).not.toContain("first");
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Duplicate component name "Box"'),
    );
    errorSpy.mockRestore();
  });
});
