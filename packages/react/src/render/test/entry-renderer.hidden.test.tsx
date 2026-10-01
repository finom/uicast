import { act } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ComponentEntry } from "@uicast/core";
import { mountEntries } from "../../../test/render-helpers";

// `Activity mode="hidden"` keeps the node mounted and sets `display: none` on its host children.
describe("EntryRenderer — hidden", () => {
  it("hides the entry when hidden evaluates truthy", () => {
    const lines: ComponentEntry[] = [
      {
        key: "root",
        component: "Box",
        hidden: "scopes.root.hideIt",
        props: { expr: "({ text: 'secret' })" },
      },
    ];
    const { container } = mountEntries(lines, {
      rootScope: { hideIt: true },
    });
    const el = container.querySelector("[data-key='root']") as HTMLElement;
    expect(el).not.toBeNull();
    expect(el.style.display).toBe("none");
  });

  it("flips visibility reactively when the hidden path changes", () => {
    const lines: ComponentEntry[] = [
      {
        key: "root",
        component: "Box",
        children: ["panel"],
      },
      {
        key: "panel",
        component: "Box",
        hidden: "scopes.root.hidden",
        props: { expr: "({ text: 'panel-text' })" },
      },
    ];
    const { container, scopes } = mountEntries(lines, {
      rootScope: { hidden: false },
    });

    const panel = container.querySelector("[data-key='panel']") as HTMLElement;
    expect(panel.style.display).not.toBe("none");
    expect(container.textContent).toContain("panel-text");

    act(() => {
      scopes.root.$set("hidden", true);
    });
    expect(container.querySelector("[data-key='panel']")).toBe(panel);
    expect(panel.style.display).toBe("none");

    act(() => {
      scopes.root.$set("hidden", false);
    });
    expect(panel.style.display).not.toBe("none");
    expect(container.textContent).toContain("panel-text");
  });
});
