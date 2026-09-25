import { act, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { createComponentDefinition, type ComponentEntry } from "@uicast/core";
import { createComponentImplementation } from "@uicast/react";
import { defaultImplementations, mountEntries } from "../../../test/render-helpers";

const panelDef = createComponentDefinition({
  name: "Panel",
  description: "Shows its text and whether it is loading.",
  props: z.object({ text: z.string() }),
});
const PanelImpl = createComponentImplementation({
  def: panelDef,
  render: ({ text, children }, { entry, loading }) => (
    <div data-key={entry.key} data-loading={loading ? "true" : "false"}>
      {text}
      {children}
    </div>
  ),
});

describe("EntryRenderer — loading", () => {
  it("evaluates `loading` reactively and hands it to render with the entry", async () => {
    const lines: ComponentEntry[] = [
      { key: "root", component: "Box", children: ["panel", "btn"] },
      {
        key: "panel",
        component: "Panel",
        props: { expr: "({ text: 'rows' })" },
        loading: "scopes.root.busy",
      },
      {
        key: "btn",
        component: "Button",
        props: { expr: "({ label: 'go' })" },
        callbacks: { onClick: [{ set: "scopes.root.busy", expr: "!currentValue" }] },
      },
    ];
    const { container } = mountEntries(lines, {
      rootScope: { busy: false },
      implementations: { ...defaultImplementations, Panel: PanelImpl },
    });
    const panel = () => container.querySelector("[data-key='panel']") as HTMLElement;
    expect(panel().dataset.loading).toBe("false");

    await act(async () => {
      fireEvent.click(container.querySelector("button[data-key='btn']") as HTMLButtonElement);
    });
    await waitFor(() => expect(panel().dataset.loading).toBe("true"));
  });

  it("is false when the entry has no `loading`", () => {
    const lines: ComponentEntry[] = [{ key: "panel", component: "Panel", props: { expr: "({ text: 'x' })" } }];
    const { container } = mountEntries(lines, { implementations: { ...defaultImplementations, Panel: PanelImpl } });
    expect((container.querySelector("[data-key='panel']") as HTMLElement).dataset.loading).toBe("false");
  });
});
