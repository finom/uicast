import { act } from "@testing-library/react";
import type { StandardToolV0 } from "standard-tool";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { createComponentDefinition } from "@uicast/core";
import { createComponentImplementation } from "@uicast/react";
import { mountEntries } from "../../../test/render-helpers";

const Panel = createComponentImplementation({
  def: createComponentDefinition({ name: "Panel", description: "panel", props: z.object({ title: z.string().optional() }) }),
  render: ({ title, children }) => (
    <section>
      {title}
      {children}
    </section>
  ),
  skeleton: ({ children }) => <section data-sk="">{children}</section>,
});
const Line = createComponentImplementation({
  def: createComponentDefinition({ name: "Line", description: "line", props: z.object({ text: z.string().optional() }) }),
  render: ({ text }) => <p>{text}</p>,
  skeleton: () => <i />,
});
const implementations = { Panel, Line };

// A host function that resolves when the test says so.
function gated() {
  let open!: (value: unknown) => void;
  const gate = new Promise((resolve) => {
    open = resolve;
  });
  const load: StandardToolV0 = { name: "load", description: "", execute: () => gate };
  return { load, open };
}

describe("EntryRenderer — skeleton while a seed loads", () => {
  it("draws the element's subtree as skeletons, not the element itself", async () => {
    const { load, open } = gated();
    const { container } = mountEntries(
      [
        {
          key: "root",
          component: "Panel",
          seed: [{ set: "scopes.root.rows", expr: "load()" }],
          props: { literal: { title: "Orders" } },
          children: ["note", "rows"],
        },
        { key: "note", component: "Line", props: { literal: { text: "note" } } },
        { key: "rows", component: "Line", each: "scopes.root.rows", as: "row", props: { expr: "({ text: scopes.row.name })" } },
      ],
      { implementations, functions: [load] },
    );
    expect(container.innerHTML).toBe('<section data-sk=""><i></i><i></i><i></i><i></i></section>');

    await act(async () => open([{ name: "Ann" }]));
    expect(container.innerHTML).toBe("<section>Orders<p>note</p><p>Ann</p></section>");
  });

  it("draws three items for a list whose own seed loads", async () => {
    const { load, open } = gated();
    const { container } = mountEntries(
      [
        { key: "root", component: "Panel", children: ["rows"] },
        {
          key: "rows",
          component: "Line",
          seed: [{ set: "scopes.root.rows", expr: "load()" }],
          each: "scopes.root.rows",
          as: "row",
          props: { expr: "({ text: scopes.row.name })" },
        },
      ],
      { implementations, functions: [load] },
    );
    expect(container.innerHTML).toBe("<section><i></i><i></i><i></i></section>");

    await act(async () => open([{ name: "Ann" }]));
    expect(container.innerHTML).toBe("<section><p>Ann</p></section>");
  });

  it("does not fail on a prop that reads the data still loading", async () => {
    const { load, open } = gated();
    const onError = vi.fn();
    const { container } = mountEntries(
      [
        {
          key: "root",
          component: "Panel",
          seed: [{ set: "scopes.root.order", expr: "load()" }],
          props: { expr: "({ title: scopes.root.order.name })" },
        },
      ],
      { implementations, functions: [load], onError },
    );
    expect(container.innerHTML).toBe('<section data-sk=""></section>');

    await act(async () => open({ name: "Ann" }));
    expect(container.innerHTML).toBe("<section>Ann</section>");
    expect(onError).not.toHaveBeenCalled();
  });

  it("adds an entry that streams in while its parent's seed loads", async () => {
    const { load } = gated();
    let view!: ReturnType<typeof mountEntries>;
    // Async, so the fallback's effects run and its entries subscribe.
    await act(async () => {
      view = mountEntries(
        [{ key: "root", component: "Panel", seed: [{ set: "scopes.root.x", expr: "load()" }], children: ["note"] }],
        { implementations, functions: [load] },
      );
    });
    const { container, emit } = view;
    expect(container.innerHTML).toBe('<section data-sk=""></section>');

    emit({ key: "note", component: "Line" });
    expect(container.innerHTML).toBe('<section data-sk=""><i></i></section>');
  });

  it("draws a waiting element its `hidden` shows, and leaves out a child with `hidden`", () => {
    const { load } = gated();
    const { container } = mountEntries(
      [
        { key: "root", component: "Panel", hidden: "false", seed: [{ set: "scopes.root.x", expr: "load()" }], children: ["a", "b"] },
        { key: "a", component: "Line" },
        { key: "b", component: "Line", hidden: "!scopes.root.x" },
      ],
      { implementations, functions: [load] },
    );
    expect(container.innerHTML).toBe('<section data-sk=""><i></i></section>');
  });

  it("passes the skeleton its known props, so it can draw a literal one", async () => {
    const { load, open } = gated();
    const Titled = createComponentImplementation({
      def: createComponentDefinition({ name: "Titled", description: "titled", props: z.object({ title: z.string() }) }),
      render: ({ title }) => <h2>{title}</h2>,
      skeleton: ({ knownProps }) => <h2 data-sk="">{knownProps?.title}</h2>,
    });
    const { container } = mountEntries(
      [
        {
          key: "root",
          component: "Titled",
          seed: [{ set: "scopes.root.x", expr: "load()" }],
          props: { literal: { title: "Orders" } },
        },
      ],
      { implementations: { Titled }, functions: [load] },
    );
    expect(container.innerHTML).toBe('<h2 data-sk="">Orders</h2>');

    await act(async () => open(1));
    expect(container.innerHTML).toBe("<h2>Orders</h2>");
  });

  it("draws nothing for a hidden element", () => {
    const { load } = gated();
    const { container } = mountEntries(
      [{ key: "root", component: "Panel", hidden: "true", seed: [{ set: "scopes.root.x", expr: "load()" }] }],
      { implementations, functions: [load] },
    );
    expect(container.innerHTML).toBe("");
  });
});
