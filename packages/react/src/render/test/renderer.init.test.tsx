import { act, render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EntriesRenderer, RendererProvider } from "@uicast/react";
import type { InitFn } from "@uicast/react";
import type { ComponentEntry } from "@uicast/core";
import { defaultImplementationsList, testEvaluator } from "../../../test/render-helpers";

describe("RendererProvider — init prop", () => {
  it("sync init seeds scope before children mount", () => {
    const lines: ComponentEntry[] = [
      {
        key: "root",
        component: "Box",
        props: { expr: "({ text: scopes.root.greeting })" },
      },
    ];

    const init: InitFn = ({ scopes }) => {
      (scopes.root as Record<string, unknown>).greeting = "hello";
    };

    const { container } = render(
      <RendererProvider evaluator={testEvaluator} implementations={defaultImplementationsList} init={init}>
        <EntriesRenderer entries={lines} />
      </RendererProvider>,
    );
    expect(container.textContent).toContain("hello");
  });

  it("async init Suspends until the Promise resolves, then renders children", async () => {
    const lines: ComponentEntry[] = [
      {
        key: "root",
        component: "Box",
        props: { expr: "({ text: scopes.root.headings })" },
      },
    ];

    let resolveInit!: () => void;
    const initGate = new Promise<void>((resolve) => {
      resolveInit = resolve;
    });

    const init: InitFn = async ({ scopes }) => {
      await initGate;
      (scopes.root as Record<string, unknown>).headings = "resolved";
    };

    let container!: HTMLElement;
    await act(async () => {
      const result = render(
        <RendererProvider evaluator={testEvaluator} implementations={defaultImplementationsList} init={init}>
          <EntriesRenderer entries={lines} />
        </RendererProvider>,
      );
      container = result.container;
    });

    expect(container.textContent).not.toContain("resolved");

    await act(async () => {
      resolveInit();
    });

    await waitFor(() => {
      expect(container.textContent).toContain("resolved");
    });
  });

  it("renders normally when init is omitted (RootFragment wrap is invisible)", () => {
    const lines: ComponentEntry[] = [
      {
        key: "root",
        component: "Box",
        props: { expr: "({ text: 'plain' })" },
      },
    ];

    const { container } = render(
      <RendererProvider evaluator={testEvaluator} implementations={defaultImplementationsList}>
        <EntriesRenderer entries={lines} />
      </RendererProvider>,
    );
    expect(container.textContent).toContain("plain");

    const rootBox = container.querySelector('[data-key="root"]');
    expect(rootBox).not.toBeNull();
    expect(container.querySelector('[data-key="__root_fragment__"]')).toBeNull();
  });

  it("init fires exactly once even as new entries stream in (rerender)", () => {
    const initSpy = vi.fn<InitFn>(({ scopes }) => {
      (scopes.root as Record<string, unknown>).seed = "once";
    });
    const initialLines: ComponentEntry[] = [
      {
        key: "a",
        component: "Box",
        props: { expr: "({ text: 'A:' + scopes.root.seed })" },
      },
    ];
    const { container, rerender } = render(
      <RendererProvider evaluator={testEvaluator} implementations={defaultImplementationsList} init={initSpy}>
        <EntriesRenderer entries={initialLines} />
      </RendererProvider>,
    );
    expect(initSpy).toHaveBeenCalledTimes(1);
    expect(container.textContent).toContain("A:once");

    const nextLines: ComponentEntry[] = [
      ...initialLines,
      {
        key: "b",
        component: "Box",
        props: { expr: "({ text: 'B:' + scopes.root.seed })" },
      },
    ];
    rerender(
      <RendererProvider evaluator={testEvaluator} implementations={defaultImplementationsList} init={initSpy}>
        <EntriesRenderer entries={nextLines} />
      </RendererProvider>,
    );

    expect(initSpy).toHaveBeenCalledTimes(1);
    expect(container.textContent).toContain("A:once");
    expect(container.textContent).toContain("B:once");
  });

  it("wraps multi-root trees under a single RootFragment; init fires once for the whole tree", () => {
    const initSpy = vi.fn<InitFn>(({ scopes }) => {
      (scopes.root as Record<string, unknown>).label = "shared";
    });
    const lines: ComponentEntry[] = [
      {
        key: "rootA",
        component: "Box",
        props: { expr: "({ text: 'A=' + scopes.root.label })" },
      },
      {
        key: "rootB",
        component: "Box",
        props: { expr: "({ text: 'B=' + scopes.root.label })" },
      },
    ];

    const { container } = render(
      <RendererProvider evaluator={testEvaluator} implementations={defaultImplementationsList} init={initSpy}>
        <EntriesRenderer entries={lines} />
      </RendererProvider>,
    );

    expect(initSpy).toHaveBeenCalledTimes(1);
    expect(container.textContent).toContain("A=shared");
    expect(container.textContent).toContain("B=shared");
  });

  it("seeds nested object state — downstream entry reads via string expression", () => {
    const lines: ComponentEntry[] = [
      {
        key: "root",
        component: "Box",
        props: {
          expr: "({ text: scopes.root.headings.customers.email })",
        },
      },
    ];

    const init: InitFn = ({ scopes }) => {
      (scopes.root as Record<string, unknown>).headings = {
        customers: { email: "Email", customer: "Customer" },
        orders: { total: "Total" },
      };
    };

    const { container } = render(
      <RendererProvider evaluator={testEvaluator} implementations={defaultImplementationsList} init={init}>
        <EntriesRenderer entries={lines} />
      </RendererProvider>,
    );
    expect(container.textContent).toContain("Email");
  });
});
