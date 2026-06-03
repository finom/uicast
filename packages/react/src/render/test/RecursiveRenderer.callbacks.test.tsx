import { act, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Fired } from "@ui-fired/core/types";
import { mountChunks } from "../../../test/renderHelpers";

describe("RecursiveRenderer — callbacks", () => {
  it("fires a callback that $sets a path the renderer reads", async () => {
    const lines: Fired.Element[] = [
      {
        key: "root",
        component: "Box",
        children: ["btn", "label"],
      },
      {
        key: "btn",
        component: "Button",
        props: { expr: "({ label: 'inc' })" },
        callbacks: {
          onClick: [{ set: "scopes.root.count", expr: "scopes.root.count + 1" }],
        },
      },
      {
        key: "label",
        component: "Box",
        props: { expr: "({ text: scopes.root.count })" },
      },
    ];
    const { container } = mountChunks(lines, {
      rootScope: { count: 0 },
    });

    expect(container.textContent).toContain("0");
    const btn = container.querySelector(
      "button[data-key='btn']",
    ) as HTMLButtonElement;
    expect(btn).not.toBeNull();

    await act(async () => {
      fireEvent.click(btn);
    });
    await waitFor(() => {
      expect(container.textContent).toContain("1");
    });
  });

  it("makes evt available inside callback expressions", async () => {
    const onClick = vi.fn();
    const lines: Fired.Element[] = [
      {
        key: "root",
        component: "Button",
        props: { expr: "({ label: 'go' })" },
        callbacks: {
          onClick: [{ set: "scopes.root.eventPayload", expr: "captured(evt)" }],
        },
      },
    ];
    const { container } = mountChunks(lines, {
      rootScope: {},
      functions: [
        {
          name: "captured",
          description: "",
          execute(evt: unknown) {
            onClick(evt);
            return evt;
          },
        },
      ],
    });

    const btn = container.querySelector("button") as HTMLButtonElement;
    await act(async () => {
      fireEvent.click(btn);
    });
    await waitFor(() => {
      expect(onClick).toHaveBeenCalledOnce();
    });
  });

  it("runs multiple set-expressions in a single callback in order", async () => {
    const lines: Fired.Element[] = [
      {
        key: "root",
        component: "Box",
        children: ["btn", "labelA", "labelB"],
      },
      {
        key: "btn",
        component: "Button",
        callbacks: {
          onClick: [
            { set: "scopes.root.a", literal: "first" },
            { set: "scopes.root.b", literal: "second" },
          ],
        },
      },
      {
        key: "labelA",
        component: "Box",
        props: { expr: "({ text: scopes.root.a })" },
      },
      {
        key: "labelB",
        component: "Box",
        props: { expr: "({ text: scopes.root.b })" },
      },
    ];
    const { container } = mountChunks(lines, {
      rootScope: { a: "", b: "" },
    });

    const btn = container.querySelector("button") as HTMLButtonElement;
    await act(async () => {
      fireEvent.click(btn);
    });
    await waitFor(() => {
      expect(container.textContent).toContain("first");
      expect(container.textContent).toContain("second");
    });
  });
});
