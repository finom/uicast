// @vitest-environment node
import { renderToString } from "react-dom/server";
import { prerender } from "react-dom/static";
import { standardTool } from "standard-tool";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { createComponentDefinition, type ComponentEntry, type EntryError } from "@uicast/core";
import { Evaluator } from "@uicast/expr";
import { createComponentImplementation, EntriesRenderer, RendererProvider } from "@uicast/react";

const Box = createComponentImplementation({
  def: createComponentDefinition({ name: "Box", description: "div", props: z.object({ text: z.string().optional() }) }),
  render: ({ text, children }) => <div>{text}{children}</div>,
  skeleton: () => <i>waiting</i>,
});
const Panel = createComponentImplementation({
  def: createComponentDefinition({ name: "Panel", description: "section", props: z.object({}) }),
  render: ({ children }) => <section>{children}</section>,
  skeleton: ({ children }) => <section data-sk="">{children}</section>,
});
const Line = createComponentImplementation({
  def: createComponentDefinition({ name: "Line", description: "line", props: z.object({}) }),
  render: () => <p />,
  skeleton: () => <i />,
});

const entries: ComponentEntry[] = [
  { key: "page", component: "Box", seed: [{ set: "scopes.root.rows", expr: "listRows()" }], children: ["row"] },
  { key: "row", component: "Box", each: "scopes.root.rows", as: "row", props: { expr: "({ text: scopes.row.name })" } },
];

const serverPass = async (execute: () => Promise<unknown>) => {
  const listRows = standardTool({ name: "listRows", description: "rows", execute });
  const reported: EntryError[] = [];
  const reactErrors: unknown[] = [];
  const { prelude } = await prerender(
    <RendererProvider implementations={[Box]} evaluator={new Evaluator({ functions: [listRows] })} onError={(e) => reported.push(e)}>
      <EntriesRenderer entries={entries} />
    </RendererProvider>,
    { onError: (err) => void reactErrors.push(err) },
  );
  return { html: await new Response(prelude).text(), reported, reactErrors };
};

describe("EntryRenderer — server pass", () => {
  it("waits for an async seed and renders its data", async () => {
    const { html, reported } = await serverPass(async () => [{ name: "Ann" }, { name: "Bo" }]);
    expect(html).toContain("Ann");
    expect(html).toContain("Bo");
    expect(reported).toEqual([]);
  });

  it("sends the skeleton for a failed seed and reports it once", async () => {
    const { html, reported, reactErrors } = await serverPass(async () => {
      throw new Error("database down");
    });
    expect(html).toContain("waiting");
    expect(html).not.toContain("Ann");
    expect(reported).toHaveLength(1);
    expect(reported[0].message).toContain("database down");
    expect(reported[0].elementKey).toBe("page");
    expect(reactErrors).toHaveLength(1);
  });

  it("sends the skeleton of the element's subtree when the render cannot wait", () => {
    const listRows = standardTool({ name: "listRows", description: "rows", execute: () => new Promise(() => {}) });
    const html = renderToString(
      <RendererProvider implementations={[Panel, Line]} evaluator={new Evaluator({ functions: [listRows] })}>
        <EntriesRenderer
          entries={[
            { key: "page", component: "Panel", seed: [{ set: "scopes.root.rows", expr: "listRows()" }], children: ["row"] },
            { key: "row", component: "Line", each: "scopes.root.rows", as: "row" },
          ]}
        />
      </RendererProvider>,
    );
    expect(html).toContain('<section data-sk=""><i></i><i></i><i></i></section>');
  });
});
