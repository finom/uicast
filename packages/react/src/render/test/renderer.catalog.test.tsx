import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createComponentDefinition, type ComponentEntry } from "@uicast/core";
import { createComponentImplementation, EntriesRenderer, RendererProvider } from "@uicast/react";
import type { InitFn } from "@uicast/react";
import { z } from "zod";
import { defaultImplementationsList, testEvaluator } from "../../../test/render-helpers";

describe("RendererProvider — implementations prop", () => {
  it("renders an entry tree from a catalog array passed as a prop (merging RootFragment when absent)", () => {
    const lines: ComponentEntry[] = [
      {
        key: "k1",
        component: "Box",
        props: { expr: "({ text: 'from-catalog-prop' })" },
      },
    ];
    const { container } = render(
      <RendererProvider evaluator={testEvaluator} implementations={defaultImplementationsList}><EntriesRenderer entries={lines} /></RendererProvider>,
    );
    expect(container.textContent).toContain("from-catalog-prop");
  });

  it("gives each RendererProvider an isolated root scope", () => {
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
        <RendererProvider evaluator={testEvaluator} implementations={defaultImplementationsList} init={initA}><EntriesRenderer entries={box("rA")} /></RendererProvider>
        <RendererProvider evaluator={testEvaluator} implementations={defaultImplementationsList} init={initB}><EntriesRenderer entries={box("rB")} /></RendererProvider>
      </>,
    );

    expect(rootA).toBeDefined();
    expect(rootB).toBeDefined();
    expect(rootA).not.toBe(rootB);
  });

  it("throws on a duplicate component name", () => {
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
    expect(() =>
      render(
        <RendererProvider evaluator={testEvaluator} implementations={[first, second]}><EntriesRenderer entries={lines} /></RendererProvider>,
      ),
    ).toThrow(/Duplicate component name "Box"/);
    errorSpy.mockRestore();
  });

  it("exposes only def and placeholder, and refuses an implementation it did not make", () => {
    const boxDef = createComponentDefinition({ name: "Box", description: "test box", props: z.object({}) });
    const made = createComponentImplementation({ def: boxDef, render: () => <span>made</span> });
    expect(Object.keys(made).sort()).toEqual(["def", "placeholder"]);

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const lines: ComponentEntry[] = [{ key: "k", component: "Box" }];
    expect(() =>
      render(
        <RendererProvider evaluator={testEvaluator} implementations={[{ ...made }]}><EntriesRenderer entries={lines} /></RendererProvider>,
      ),
    ).toThrow(/"Box" was not made by createComponentImplementation/);
    errorSpy.mockRestore();
  });
});
