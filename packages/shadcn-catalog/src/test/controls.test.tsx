import type { ComponentEntry } from "@uicast/core";
import { Evaluator } from "@uicast/expr";
import { EntriesRenderer, RendererProvider } from "@uicast/react";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { impls } from "../all/impls";

afterEach(cleanup);

async function mount(entries: ComponentEntry[]) {
  const utils = render(
    <RendererProvider implementations={impls} evaluator={new Evaluator()}>
      <EntriesRenderer entries={entries} />
    </RendererProvider>,
  );
  await act(() => new Promise((resolve) => setTimeout(resolve, 20)));
  return utils;
}

// A field bound the prompt's way: props read the state, onChange writes it back.
const bound = (component: string, value: string): ComponentEntry[] => [
  {
    key: "field",
    component,
    seed: [{ set: "scopes.root.value", literal: value }],
    props: { expr: "({ value: scopes.root.value })" },
    callbacks: { onChange: [{ set: "scopes.root.value", expr: "evt.value" }] },
  },
];

describe("bound text fields", () => {
  it.each([
    ["Input", "input"],
    ["Textarea", "textarea"],
    ["CodeEditor", "textarea"],
    ["PhoneInput", "input"],
  ])("%s keeps an edit in the middle of the text", async (component, selector) => {
    const { container } = await mount(bound(component, "Ada"));
    const field = container.querySelector<HTMLInputElement>(`[data-key="field"]`);
    const input = field?.matches(selector) ? field : field?.querySelector<HTMLInputElement>(selector);
    if (!input) throw new Error("no field");
    fireEvent.change(input, { target: { value: "Adxa" } });
    // React restores a controlled value right after the event; the state write lands later.
    expect(input.value).toBe("Adxa");
    await act(() => new Promise((resolve) => setTimeout(resolve, 20)));
    expect(input.value).toBe("Adxa");
  });
});

describe("CurrencyInput", () => {
  const currency = (props: Record<string, unknown>): ComponentEntry[] => [
    { key: "root", component: "FlexCol", children: ["field", "stored"] },
    {
      key: "field",
      component: "CurrencyInput",
      props: { expr: `({ ...${JSON.stringify(props)}, value: scopes.root.value })` },
      callbacks: { onChange: [{ set: "scopes.root.value", expr: "evt.value" }] },
    },
    { key: "stored", component: "Typography", props: { expr: "({ text: String(scopes.root.value) })" } },
  ];

  it.each([
    ["en-US", "USD", "1,500", 1500],
    ["en-US", "USD", "1,234.5", 1234.5],
    ["de-DE", "EUR", "1.500", 1500],
    ["de-DE", "EUR", "24,99", 24.99],
    ["de-DE", "JPY", "1.500", 1500],
    ["fr-FR", "EUR", "1 500,25", 1500.25],
    ["sv-SE", "SEK", "\u22121 500,5", -1500.5],
  ])("%s %s reads %j as %d", async (locale, code, text, expected) => {
    const { container, getByText } = await mount(currency({ locale, currency: code }));
    const input = container.querySelector("input") as HTMLInputElement;
    const type = async (value: string) => {
      fireEvent.change(input, { target: { value } });
      await act(() => new Promise((resolve) => setTimeout(resolve, 20)));
    };
    fireEvent.focus(input);
    await type(text);
    getByText(String(expected));
    // On focus the draft is the stored value in the locale's format, so it reads back the same.
    fireEvent.blur(input);
    fireEvent.focus(input);
    await type(input.value);
    getByText(String(expected));
  });
});

describe("DatePicker", () => {
  it("keeps a partly typed date", async () => {
    const { container } = await mount(bound("DatePicker", "2024-01-15"));
    const input = container.querySelector("input") as HTMLInputElement;
    // A browser reads a partly typed date as "".
    fireEvent.change(input, { target: { value: "" } });
    expect(input.value).toBe("");
    fireEvent.change(input, { target: { value: "2024-03-15" } });
    await act(() => new Promise((resolve) => setTimeout(resolve, 20)));
    expect(input.value).toBe("2024-03-15");
  });
});
