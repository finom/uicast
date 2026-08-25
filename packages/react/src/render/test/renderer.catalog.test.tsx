import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createComponentDefinition, type ComponentEntry } from "@uicast/core";
import { createComponentImplementation, EntriesRenderer, RendererProvider } from "@uicast/react";
import type { InitFn } from "@uicast/react/types";
import { z } from "zod";
import { defaultImplementationsList } from "../../../test/render-helpers";

// `catalog` is a runtime prop on the <RendererProvider> — an array of
// implementations, symmetric with `functions`. The provider builds the name→renderer
// lookup itself. These tests pin that prop path directly.
describe("Renderer — catalog prop", () => {
  it("renders an entry tree from a catalog array passed as a prop (merging RootFragment when absent)", () => {
    // `defaultImplementationsList` carries no `RootFragment` entry, so a successful render
    // also proves the provider's RootFragment merge — without it the synthetic root
    // wrapper would hit the Unknown-component branch and nothing would show.
    const lines: ComponentEntry[] = [
      {
        key: "k1",
        component: "Box",
        props: { expr: "({ text: 'from-catalog-prop' })" },
      },
    ];
    const { container } = render(
      <RendererProvider implementations={defaultImplementationsList}><EntriesRenderer entries={lines} /></RendererProvider>,
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
        <RendererProvider implementations={defaultImplementationsList} init={initA}><EntriesRenderer entries={box("rA")} /></RendererProvider>
        <RendererProvider implementations={defaultImplementationsList} init={initB}><EntriesRenderer entries={box("rB")} /></RendererProvider>
      </>,
    );

    expect(rootA).toBeDefined();
    expect(rootB).toBeDefined();
    expect(rootA).not.toBe(rootB);
  });

  it("on a duplicate component name the later renderer wins and logs an error", () => {
    // Two implementations share the def name "Box". The provider builds its map
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
      <RendererProvider implementations={[first, second]}><EntriesRenderer entries={lines} /></RendererProvider>,
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
