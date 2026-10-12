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
