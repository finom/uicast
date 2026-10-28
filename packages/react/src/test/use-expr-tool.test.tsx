import { act, render } from "@testing-library/react";
import type { ComponentEntry } from "@uicast/core";
import type { ExprToolOutput } from "@uicast/core/tool";
import { Evaluator } from "@uicast/expr";
import { EntriesRenderer, RendererProvider, useExprTool } from "@uicast/react";
import { standardTool } from "standard-tool";
import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { defaultImplementationsList } from "../../test/render-helpers";

// A table of rows with a mark on the selected ones, as a generated UI writes it.
const table: ComponentEntry[] = [
  {
    key: "root",
    component: "Box",
    seed: [
      { set: "scopes.root.rows", literal: ["a", "b", "c", "d"].map((name, id) => ({ id, name })) },
      { set: "scopes.root.selected", literal: {} },
    ],
    children: ["row"],
  },
  {
    key: "row",
    component: "Box",
    each: "scopes.root.rows",
    as: "item",
    keyBy: "id",
    props: { expr: "({ text: scopes.item.name + (scopes.root.selected?.[scopes.item.id] ? '*' : '') + ';' })" },
  },
];

type Tool = NonNullable<ConstructorParameters<typeof Evaluator>[0]>["functions"];

function mount(functions: ConstructorParameters<typeof Evaluator>[0] = {}, toolFunctions?: Tool, read = true) {
  let run!: (input: unknown) => Promise<ExprToolOutput>;
  const Probe = () => {
    run = useExprTool({ read, functions: toolFunctions });
    return null;
  };
  const view = render(
    <RendererProvider implementations={defaultImplementationsList} evaluator={new Evaluator(functions)}>
      <EntriesRenderer entries={table} />
      <Probe />
    </RendererProvider>,
  );
  const call = async (input: unknown) => {
    let output!: ExprToolOutput;
    await act(async () => {
      output = await run(input);
    });
    return output;
  };
  return { ...view, call };
}

describe("useExprTool", () => {
  const originalConfirm = window.confirm;
  afterEach(() => {
    window.confirm = originalConfirm;
  });

  it("reads the state the UI shows", async () => {
    const { call } = mount();
    expect(await call({ read: "scopes.root.rows.map(r => r.name)" })).toEqual({ value: ["a", "b", "c", "d"] });
  });

  it("writes state, and the UI shows it", async () => {
    const { call, container } = mount();
    const output = await call({
      steps: [
        {
          set: "scopes.root.selected",
          expr: "scopes.root.rows.slice(0, 2).reduce((m, r) => ({ ...m, [r.id]: true }), {})",
        },
      ],
      read: "Object.keys(scopes.root.selected).length",
    });
    expect(output).toEqual({ value: 2 });
    expect(container.textContent).toBe("a*;b*;c;d;");
  });

  it("passes the selection to a host function", async () => {
    const download = vi.fn();
    const downloadCsv = standardTool({
      name: "downloadCsv",
      description: "Saves rows as a CSV file.",
      inputSchema: z.object({ rows: z.array(z.object({ id: z.number(), name: z.string() })) }),
      execute: download,
    });
    const { call } = mount({ functions: [downloadCsv] });
    await call({ steps: [{ set: "scopes.root.selected", literal: { 1: true, 3: true } }] });
    expect(
      await call({
        steps: [{ expr: "downloadCsv({ rows: scopes.root.rows.filter(r => scopes.root.selected[r.id]) })" }],
      }),
    ).toEqual({});
    expect(download).toHaveBeenCalledWith(
      {
        rows: [
          { id: 1, name: "b" },
          { id: 3, name: "d" },
        ],
      },
      undefined,
    );
  });

  describe("with its own functions", () => {
    const execute = vi.fn((input: { id: number }) => ({ id: input.id, name: "Ann" }));
    const tool = (name: string) =>
      standardTool({ name, description: name, inputSchema: z.object({ id: z.number() }), execute });
    const [getCustomer, deleteCustomer, exportCustomer] = ["getCustomer", "deleteCustomer", "exportCustomer"].map(tool);
    const ui = { functions: [getCustomer, deleteCustomer] };
    const select = { set: "scopes.root.selected", literal: { 0: true } };
    afterEach(() => execute.mockClear());

    it("calls the provider's functions when given none", async () => {
      const { call } = mount(ui);
      expect(await call({ read: "deleteCustomer({ id: 1 })" })).toEqual({ value: { id: 1, name: "Ann" } });
    });

    it("calls only the ones it was given", async () => {
      const { call } = mount(ui, [getCustomer]);
      expect(await call({ read: "getCustomer({ id: 2 })" })).toEqual({ value: { id: 2, name: "Ann" } });
      expect(execute).toHaveBeenCalledOnce();
    });

    it("refuses one of the provider's it wasn't given, before any step runs", async () => {
      const { call, container } = mount(ui, [getCustomer]);
      expect(await call({ steps: [select, { expr: "deleteCustomer({ id: 1 })" }] })).toEqual({
        error: {
          reason: "unknown-reference",
          message: '"deleteCustomer": not available to the expr tool, which calls only getCustomer',
        },
      });
      expect(execute).not.toHaveBeenCalled();
      expect(container.textContent).toBe("a;b;c;d;");
    });

    it("calls none when given none", async () => {
      const { call } = mount(ui, []);
      expect(await call({ read: "getCustomer({ id: 1 })" })).toEqual({
        error: {
          reason: "unknown-reference",
          message: '"getCustomer": not available to the expr tool, which calls no function',
        },
      });
    });

    it("calls one the UI doesn't have", async () => {
      const { call } = mount(ui, [exportCustomer]);
      expect(await call({ read: "exportCustomer({ id: 3 })" })).toEqual({ value: { id: 3, name: "Ann" } });
    });
  });

  it("leaves an expression that doesn't parse to fail classified when it runs", async () => {
    const { call } = mount({}, []);
    expect(await call({ read: "deleteCustomer(" })).toMatchObject({ error: { reason: "expression-syntax" } });
  });

  it("answers declined when the user cancels a confirm, and skips the step", async () => {
    window.confirm = vi.fn(() => false);
    const { call, container } = mount();
    expect(
      await call({ steps: [{ confirm: "Select all?", set: "scopes.root.selected", literal: { 0: true } }] }),
    ).toEqual({
      declined: true,
    });
    expect(window.confirm).toHaveBeenCalledWith("Select all?");
    expect(container.textContent).toBe("a;b;c;d;");
  });

  it("answers a classified error the model can fix", async () => {
    const { call } = mount();
    expect(await call({ steps: [{ set: "scopes.nope.x", literal: 1 }] })).toMatchObject({
      error: { reason: "unknown-reference" },
    });
    expect(await call({ read: "scopes.root.rows.map(" })).toMatchObject({ error: { reason: "expression-syntax" } });
    expect(await call({ steps: [{ set: "scopes.root.rows.0", literal: 1 }] })).toMatchObject({
      error: { reason: "guardrail-violation" },
    });
  });

  it("refuses a bad input before running anything", async () => {
    const { call } = mount();
    expect(await call({ read: 1 })).toEqual({
      error: { reason: "invalid-entry", message: "read: Expected a string" },
    });
  });

  describe("without read (the default)", () => {
    it("runs steps and answers no value", async () => {
      const { call, container } = mount({}, undefined, false);
      expect(await call({ steps: [{ set: "scopes.root.selected", literal: { 2: true } }] })).toEqual({});
      expect(container.textContent).toBe("a;b;c*;d;");
    });

    it("refuses a call that reads, before any step runs", async () => {
      const { call, container } = mount({}, undefined, false);
      expect(
        await call({ steps: [{ set: "scopes.root.selected", literal: { 0: true } }], read: "scopes.root.rows" }),
      ).toEqual({ error: { reason: "invalid-entry", message: "read: Off: this tool sends no value back" } });
      expect(container.textContent).toBe("a;b;c;d;");
    });

    it("still answers errors, for the model to fix the call", async () => {
      const { call } = mount({}, undefined, false);
      expect(await call({ steps: [{ set: "scopes.root.x", expr: "scopes.root.rows.map(" }] })).toMatchObject({
        error: { reason: "expression-syntax" },
      });
    });
  });

  it("refuses a read too long to hand back", async () => {
    const { call } = mount();
    expect(await call({ read: "'x'.repeat(9000)" })).toMatchObject({
      error: { reason: "budget-exceeded", message: expect.stringContaining("over 8000") },
    });
  });
});
