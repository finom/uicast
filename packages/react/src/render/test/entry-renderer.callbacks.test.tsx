import { act, fireEvent, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ComponentEntry } from "@uicast/core";
import type { ConfirmComponentProps } from "@uicast/react";
import { ConfirmHost } from "@uicast/react/providers/confirm";
import { mountEntries } from "../../../test/render-helpers";

describe("EntryRenderer — callbacks", () => {
  it("fires a callback that $sets a path the renderer reads", async () => {
    const lines: ComponentEntry[] = [
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
    const { container } = mountEntries(lines, {
      rootScope: { count: 0 },
    });

    expect(container.textContent).toContain("0");
    const btn = container.querySelector("button[data-key='btn']") as HTMLButtonElement;
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
    const lines: ComponentEntry[] = [
      {
        key: "root",
        component: "Button",
        props: { expr: "({ label: 'go' })" },
        callbacks: {
          onClick: [{ set: "scopes.root.eventPayload", expr: "captured(evt)" }],
        },
      },
    ];
    const { container } = mountEntries(lines, {
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

  it("applies every step of a multi-step callback", async () => {
    const lines: ComponentEntry[] = [
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
    const { container } = mountEntries(lines, {
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

describe("EntryRenderer — the confirm seam", () => {
  const lines: ComponentEntry[] = [
    {
      key: "root",
      component: "Button",
      props: { expr: "({ label: 'del' })" },
      callbacks: {
        onClick: [{ confirm: "Sure?", set: "scopes.root.done", literal: true }],
      },
    },
  ];

  const originalConfirm = window.confirm;
  afterEach(() => {
    window.confirm = originalConfirm;
  });

  it("a declined confirm skips the steps without an error", async () => {
    const confirmMock = vi.fn(() => false);
    window.confirm = confirmMock;
    const onError = vi.fn();
    const { container, scopes } = mountEntries(lines, { onError });

    await act(async () => {
      fireEvent.click(container.querySelector("button") as HTMLButtonElement);
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(confirmMock).toHaveBeenCalledWith("Sure?");
    expect((scopes.root as Record<string, unknown>).done).toBeUndefined();
    expect(onError).not.toHaveBeenCalled();
  });

  it("an accepted confirm lets the steps run", async () => {
    const confirmMock = vi.fn(() => true);
    window.confirm = confirmMock;
    const { container, scopes } = mountEntries(lines);

    await act(async () => {
      fireEvent.click(container.querySelector("button") as HTMLButtonElement);
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect((scopes.root as Record<string, unknown>).done).toBe(true);
  });

  it("routes the confirm step through the host modal when one is mounted", async () => {
    const confirmMock = vi.fn(() => true);
    window.confirm = confirmMock;
    const Modal = ({ open, message, onConfirm, onCancel }: ConfirmComponentProps) =>
      open ? (
        <div role="dialog">
          <span data-modal-message>{message}</span>
          <button type="button" onClick={onConfirm}>
            modal-yes
          </button>
          <button type="button" onClick={onCancel}>
            modal-no
          </button>
        </div>
      ) : null;
    const { container, scopes, getByText } = mountEntries(lines, {
      wrapper: (children) => <ConfirmHost confirm={Modal}>{children}</ConfirmHost>,
    });

    await act(async () => {
      fireEvent.click(container.querySelector("button[data-key='root']") as HTMLButtonElement);
    });
    expect(container.querySelector("[data-modal-message]")?.textContent).toBe("Sure?");
    expect((scopes.root as Record<string, unknown>).done).toBeUndefined();

    await act(async () => {
      fireEvent.click(getByText("modal-yes"));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect((scopes.root as Record<string, unknown>).done).toBe(true);
    expect(confirmMock).not.toHaveBeenCalled();
  });
});
