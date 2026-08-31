import { act, fireEvent, render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createProxyScope, type ComponentEntry } from "@uicast/core";
import { EntriesRenderer, RendererProvider } from "@uicast/react";
import { defaultImplementationsList } from "../../../test/render-helpers";

// The point of <RendererProvider>: every <EntriesRenderer> under it shares ONE
// `root` scope, so a write from one document is live in all of them.
describe("RendererProvider — shared group store", () => {
  const seederLines: ComponentEntry[] = [
    {
      key: "writer",
      component: "Button",
      seed: [{ set: "scopes.root.orderCount", literal: 1 }],
      props: { literal: { label: "bump" } },
      callbacks: {
        onClick: [{ set: "scopes.root.orderCount", expr: "currentValue + 1" }],
      },
    },
  ];
  const readerLines: ComponentEntry[] = [
    {
      key: "reader",
      component: "Box",
      props: { expr: "({ text: scopes.root.orderCount + ' orders' })" },
    },
  ];

  it("a write in one document is live in another", async () => {
    const { container, getByText } = render(
      <RendererProvider implementations={defaultImplementationsList}>
        <EntriesRenderer entries={seederLines} />
        <EntriesRenderer entries={readerLines} />
      </RendererProvider>,
    );
    expect(container.textContent).toContain("1 orders");

    await act(async () => {
      fireEvent.click(getByText("bump"));
    });
    await waitFor(() => {
      expect(container.textContent).toContain("2 orders");
    });
  });

  it("a second document's seed does not clobber existing shared state", () => {
    const reSeeder: ComponentEntry[] = [
      {
        key: "late",
        component: "Box",
        seed: [{ set: "scopes.root.orderCount", literal: 99 }],
        props: { expr: "({ text: 'late:' + scopes.root.orderCount })" },
      },
    ];
    const { container } = render(
      <RendererProvider implementations={defaultImplementationsList}>
        <EntriesRenderer entries={seederLines} />
        <EntriesRenderer entries={reSeeder} />
      </RendererProvider>,
    );
    // seed is default-mode: first writer wins, the late block reads 1, not 99.
    expect(container.textContent).toContain("late:1");
  });

  it("group init runs once even with multiple renderers", () => {
    const init = vi.fn(({ scopes }) => {
      scopes.root.fromInit = "yes";
    });
    const { container } = render(
      <RendererProvider implementations={defaultImplementationsList} init={init}>
        <EntriesRenderer
          entries={[
            {
              key: "a",
              component: "Box",
              props: { expr: "({ text: 'a:' + scopes.root.fromInit })" },
            },
          ]}
        />
        <EntriesRenderer
          entries={[
            {
              key: "b",
              component: "Box",
              props: { expr: "({ text: 'b:' + scopes.root.fromInit })" },
            },
          ]}
        />
      </RendererProvider>,
    );
    expect(init).toHaveBeenCalledTimes(1);
    expect(container.textContent).toContain("a:yes");
    expect(container.textContent).toContain("b:yes");
  });

  it("init can add a named host scope that documents read, and the host keeps the handle", () => {
    const userLines: ComponentEntry[] = [
      {
        key: "who",
        component: "Box",
        props: { expr: "({ text: 'user:' + scopes.userCtx.name })" },
      },
    ];
    // The host owns the proxy above the provider and injects it in `init`, so it
    // is present before any entry evaluates — and the host can update it later.
    const userCtx = createProxyScope<{ name: string }>({ name: "Hopper" });
    const { container } = render(
      <RendererProvider
        implementations={defaultImplementationsList}
        init={({ scopes }) => {
          (scopes as Record<string, unknown>).userCtx = userCtx;
        }}
      >
        <EntriesRenderer entries={userLines} />
      </RendererProvider>,
    );
    expect(container.textContent).toContain("user:Hopper");

    act(() => {
      userCtx.name = "Lovelace";
    });
    expect(container.textContent).toContain("user:Lovelace");
  });

  it("throws a clear error outside a RendererProvider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() =>
      render(<EntriesRenderer entries={readerLines} />),
    ).toThrow(/must be rendered inside a <RendererProvider>/);
    spy.mockRestore();
  });
});
