import type { ComponentEntry } from "@uicast/core";
import { Evaluator } from "@uicast/expr";
import { EntriesRenderer, RendererProvider } from "@uicast/react";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { impls } from "../all/impls";
import { toCsv } from "../lib/csv";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

async function mount(entries: ComponentEntry[]) {
  const utils = render(
    <RendererProvider implementations={impls} evaluator={new Evaluator()}>
      <EntriesRenderer entries={entries} />
    </RendererProvider>,
  );
  await act(() => new Promise((resolve) => setTimeout(resolve, 20)));
  return utils;
}

// Clicks the download button under `key` and returns the file's name and text.
async function download(container: HTMLElement, key: string) {
  let blob: Blob | undefined;
  vi.spyOn(URL, "createObjectURL").mockImplementation((b) => {
    blob = b as Blob;
    return "blob:test";
  });
  vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
  let name = "";
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
    name = this.download;
  });
  const button = container.querySelector(`[data-key="${key}"] [aria-label="Download as CSV"]`);
  if (!button) throw new Error("no download button");
  fireEvent.click(button);
  if (!blob) throw new Error("no file");
  return { name, text: new TextDecoder("utf-8", { ignoreBOM: true }).decode(await blob.arrayBuffer()) };
}

describe("toCsv", () => {
  it("starts with a byte order mark and ends lines with CRLF", () => {
    expect(
      toCsv([
        ["a", "b"],
        ["1", "2"],
      ]),
    ).toBe("\uFEFFa,b\r\n1,2\r\n");
  });

  it("quotes commas, quotes, line breaks and edge spaces", () => {
    expect(toCsv([["a,b", 'say "hi"', "two\nlines", " pad"]])).toBe('\uFEFF"a,b","say ""hi""","two\nlines"," pad"\r\n');
  });

  it("keeps formulas as text and numbers as numbers", () => {
    expect(toCsv([["=1+1", "@SUM(A1)", "+x", "-5", "+3.5", "-1e3", "-"]])).toBe(
      "\uFEFF'=1+1,'@SUM(A1),'+x,-5,+3.5,-1e3,'-\r\n",
    );
  });
});

describe("Table download", () => {
  const orders: ComponentEntry[] = [
    {
      key: "orders",
      component: "Table",
      seed: [
        {
          set: "scopes.root.rows",
          literal: [
            { id: 1, name: "Mira Chen", city: "Leeds, UK", status: "toship" },
            { id: 2, name: "Jonas Weber", city: "Berlin", status: "shipped" },
            { id: 3, name: "Tom Okafor", city: "Lagos", status: "toship" },
          ],
        },
      ],
      children: ["head", "body"],
    },
    { key: "head", component: "TableHeader", children: ["head-row"] },
    { key: "head-row", component: "TableRow", children: ["h-pick", "h-name", "h-city", "h-status", "h-act"] },
    { key: "h-pick", component: "TableHead", props: { literal: { text: "" } } },
    { key: "h-name", component: "TableHead", props: { literal: { text: "Customer" } } },
    { key: "h-city", component: "TableHead", props: { literal: { text: "City" } } },
    { key: "h-status", component: "TableHead", props: { literal: { text: "Status" } } },
    { key: "h-act", component: "TableHead", props: { literal: { text: "" } } },
    { key: "body", component: "TableBody", children: ["row"] },
    {
      key: "row",
      component: "TableRow",
      each: "scopes.root.rows.filter((r) => r.status === 'toship')",
      as: "r",
      keyBy: "id",
      children: ["c-pick", "c-name", "c-city", "c-status", "c-ship"],
    },
    { key: "c-pick", component: "TableCell", children: ["pick"] },
    { key: "pick", component: "Checkbox", props: { literal: { checked: false } } },
    { key: "c-name", component: "TableCell", props: { expr: "({ text: scopes.r.name })" } },
    { key: "c-city", component: "TableCell", props: { expr: "({ text: scopes.r.city })" } },
    { key: "c-status", component: "TableCell", children: ["badge"] },
    { key: "badge", component: "Badge", props: { literal: { text: "To ship" } } },
    { key: "c-ship", component: "TableCell", children: ["ship"] },
    { key: "ship", component: "Button", props: { literal: { text: "Ship" } } },
  ];

  it("saves the rows on screen, without the control columns", async () => {
    const { container } = await mount(orders);
    const { name, text } = await download(container, "orders");
    expect(name).toBe("orders.csv");
    expect(text).toBe('\uFEFFCustomer,City,Status\r\nMira Chen,"Leeds, UK",To ship\r\nTom Okafor,Lagos,To ship\r\n');
  });
});

describe("DataGrid download", () => {
  it("saves every row, in column order", async () => {
    const { container } = await mount([
      {
        key: "grid",
        component: "DataGrid",
        props: {
          literal: {
            columns: [
              { key: "sku", header: "SKU" },
              { key: "qty", header: "Qty" },
              { key: "note", header: "Note" },
            ],
            rows: [
              { sku: "A-1", qty: 1500, note: null },
              { sku: "B-2", qty: 0, note: "=cmd" },
            ],
            maxHeight: 40,
          },
        },
      },
    ]);
    const { name, text } = await download(container, "grid");
    expect(name).toBe("grid.csv");
    expect(text).toBe("\uFEFFSKU,Qty,Note\r\nA-1,1500,\r\nB-2,0,'=cmd\r\n");
  });
});
