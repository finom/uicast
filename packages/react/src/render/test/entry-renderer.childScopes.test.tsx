import { act } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Evaluator } from "@uicast/expr";
import { standardTool } from "standard-tool";
import type { ComponentEntry } from "@uicast/core";
import { mountEntries } from "../../../test/render-helpers";

const listOrders = standardTool({
  name: "listOrders",
  description: "Orders.",
  execute: async () => [
    { id: 1, total: 2 },
    { id: 2, total: 3 },
  ],
});

const sumEntry = {
  key: "sum",
  component: "Box",
  props: {
    expr: "({ text: 'sum:' + (scopes.root.childScopes?.order ?? []).reduce((a, s) => a + s.item.total, 0) })",
  },
} as ComponentEntry;

const rowsEntry = {
  key: "rows",
  component: "Box",
  each: "scopes.root.orders",
  as: "order",
  keyBy: "id",
  props: { expr: "({ text: scopes.order.item.total })" },
} as ComponentEntry;

const card = (children: string[]) =>
  ({
    key: "card",
    component: "Box",
    seed: [{ set: "scopes.root.orders", expr: "listOrders()" }],
    children,
  }) as ComponentEntry;

async function mountAndSettle(lines: ComponentEntry[]) {
  const mounted = mountEntries(lines, { evaluator: new Evaluator({ functions: [listOrders] }) });
  await act(async () => {
    await new Promise((r) => setTimeout(r, 10));
  });
  return mounted;
}

describe("childScopes reader after an async-seeded list", () => {
  it("reader BEFORE the list", async () => {
    const { container } = await mountAndSettle([card(["sum", "rows"]), sumEntry, rowsEntry]);
    expect(container.textContent).toContain("sum:5");
  });

  it("reader AFTER the list", async () => {
    const { container } = await mountAndSettle([card(["rows", "sum"]), rowsEntry, sumEntry]);
    expect(container.textContent).toContain("sum:5");
  });
});

describe("childScopes republish on data change", () => {
  // Regression: the republish skip must compare row DATA, not proxy identity.
  // A same-length replacement keeps every item proxy (stable per id), but the
  // aggregate's only wake is the `childScopes.<as>` emit — skipping it left
  // inline totals stale after a refetch-shaped update.
  it("a same-ids replacement with new values wakes an inline aggregate", async () => {
    const { container, scopes } = await mountAndSettle([
      card(["rows", "sum"]),
      rowsEntry,
      sumEntry,
    ]);
    expect(container.textContent).toContain("sum:5");

    await act(async () => {
      scopes.root.$set("orders", [
        { id: 1, total: 9 },
        { id: 2, total: 3 },
      ]);
      await new Promise((r) => setTimeout(r, 10));
    });
    expect(container.textContent).toContain("sum:12");
  });
});
