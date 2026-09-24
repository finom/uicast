// @vitest-environment node
import { renderToString } from "react-dom/server";
import { standardTool } from "standard-tool";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { createComponentDefinition, type ComponentEntry } from "@uicast/core";
import { Evaluator } from "@uicast/expr";
import {
  createComponentImplementation,
  DocumentSkeleton,
  type FallbackComponents,
  RendererProvider,
} from "@uicast/react";

const def = (name: string) => createComponentDefinition({ name, description: name, props: z.object({}) });

const Card = createComponentImplementation({
  def: def("Card"),
  render: ({ children }) => <section>{children}</section>,
  skeleton: ({ children }) =>
    children === undefined ? <u>slot</u> : <section data-card="">{children ?? <u>empty</u>}</section>,
});
const Text = createComponentImplementation({ def: def("Text"), render: () => <p />, skeleton: () => <i>text</i> });
const Group = createComponentImplementation({ def: def("Group"), render: ({ children }) => <div>{children}</div> });
const Badge = createComponentImplementation({ def: def("Badge"), render: () => <b /> });

const draw = (entries: ComponentEntry[], fallbackComponents?: FallbackComponents, evaluator = new Evaluator()) =>
  renderToString(
    <RendererProvider
      implementations={[Card, Text, Group, Badge]}
      fallbackComponents={fallbackComponents}
      evaluator={evaluator}
    >
      <DocumentSkeleton entries={entries} />
    </RendererProvider>,
  );

const busy = (inner: string) => `<div aria-busy="true" aria-hidden="true">${inner}</div>`;

describe("DocumentSkeleton", () => {
  it("draws each skeleton with the children inside", () => {
    const html = draw([
      { key: "card", component: "Card", children: ["a", "b"] },
      { key: "a", component: "Text" },
      { key: "b", component: "Text" },
    ]);
    expect(html).toBe(busy('<section data-card=""><i>text</i><i>text</i></section>'));
  });

  it("passes null children to an element with none, so its skeleton draws its own tag", () => {
    expect(draw([{ key: "card", component: "Card" }])).toBe(busy('<section data-card=""><u>empty</u></section>'));
  });

  it("draws the children of an element without a skeleton, unwrapped", () => {
    const html = draw([
      { key: "group", component: "Group", children: ["a", "b"] },
      { key: "a", component: "Text" },
      { key: "b", component: "Text" },
    ]);
    expect(html).toBe(busy("<i>text</i><i>text</i>"));
  });

  it("draws fallbackComponents.defaultSkeleton for a leaf without a skeleton, and nothing without one", () => {
    const entries: ComponentEntry[] = [{ key: "badge", component: "Badge" }];
    expect(draw(entries, { defaultSkeleton: () => <s>bar</s> })).toBe(busy("<s>bar</s>"));
    expect(draw(entries)).toBe(busy(""));
  });

  it("passes each skeleton its own entry", () => {
    const html = draw(
      [
        { key: "group", component: "Group", children: ["a", "b"] },
        { key: "a", component: "Badge" },
        { key: "b", component: "Badge" },
      ],
      { defaultSkeleton: ({ entry }) => <s>{entry.key}</s> },
    );
    expect(html).toBe(busy("<s>a</s><s>b</s>"));
  });

  it("passes the props that need no evaluation, parsed by the definition", () => {
    const Box = createComponentImplementation({
      def: createComponentDefinition({
        name: "Box",
        description: "box",
        props: z.object({ size: z.enum(["s", "l"]).default("s") }),
      }),
      render: () => <div />,
      skeleton: ({ knownProps }) => <i>{knownProps?.size ?? "none"}</i>,
    });
    const drawBox = (props?: ComponentEntry["props"]) =>
      renderToString(
        <RendererProvider implementations={[Box]} evaluator={new Evaluator()}>
          <DocumentSkeleton entries={[{ key: "box", component: "Box", ...(props && { props }) }]} />
        </RendererProvider>,
      );
    expect(drawBox({ literal: { size: "l" } })).toBe(busy("<i>l</i>"));
    expect(drawBox()).toBe(busy("<i>s</i>"));
    expect(drawBox({ expr: "({ size: 'l' })" })).toBe(busy("<i>none</i>"));
    expect(drawBox({ literal: { size: "xl" } })).toBe(busy("<i>none</i>"));
  });

  it("passes no known props with a URL the policy refuses", () => {
    const Link = createComponentImplementation({
      def: createComponentDefinition({ name: "Link", description: "link", props: z.object({ href: z.url() }) }),
      render: ({ href }) => <a href={href}>Docs</a>,
      skeleton: ({ knownProps }) => <i>{knownProps?.href ?? "none"}</i>,
    });
    const html = renderToString(
      <RendererProvider implementations={[Link]} evaluator={new Evaluator()}>
        <DocumentSkeleton
          entries={[{ key: "link", component: "Link", props: { literal: { href: "javascript:alert(1)" } } }]}
        />
      </RendererProvider>,
    );
    expect(html).toBe(busy("<i>none</i>"));
  });

  it("draws three items for a list", () => {
    const html = draw([{ key: "rows", component: "Text", each: "scopes.root.rows", as: "row" }]);
    expect(html).toBe(busy("<i>text</i><i>text</i><i>text</i>"));
  });

  it("draws a re-emitted entry once, as its last line", () => {
    const html = draw([
      { key: "card", component: "Card" },
      { key: "card", component: "Card", children: ["a"] },
      { key: "a", component: "Text" },
    ]);
    expect(html).toBe(busy('<section data-card=""><i>text</i></section>'));
  });

  it("leaves out an element with `hidden`, since its value is not known yet", () => {
    const html = draw([
      { key: "card", component: "Card", children: ["a", "b"] },
      { key: "a", component: "Text" },
      { key: "b", component: "Text", hidden: "scopes.root.closed" },
      { key: "note", component: "Text", hidden: "true" },
    ]);
    expect(html).toBe(busy('<section data-card=""><i>text</i></section>'));
  });

  it("stops at a cycle", () => {
    const html = draw([
      { key: "page", component: "Card", children: ["a"] },
      { key: "a", component: "Card", children: ["b"] },
      { key: "b", component: "Card", children: ["a"] },
    ]);
    expect(html.match(/data-card/g)).toHaveLength(3);
  });

  it("evaluates nothing: no seed, no expression, no host function", () => {
    const execute = vi.fn(async () => []);
    const listRows = standardTool({ name: "listRows", description: "rows", execute });
    const html = draw(
      [
        { key: "page", component: "Card", seed: [{ set: "scopes.root.rows", expr: "listRows()" }], children: ["row"] },
        { key: "row", component: "Text", each: "scopes.root.rows", as: "row", props: { expr: "listRows()" } },
      ],
      undefined,
      new Evaluator({ functions: [listRows] }),
    );
    expect(html).toContain("<i>text</i>");
    expect(execute).not.toHaveBeenCalled();
  });
});
