import { act, fireEvent, renderHook, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ConfirmHost, useConfirm } from "../confirm";
import type { ConfirmComponentProps } from "../../types";

// The engine half of the confirm flow: `ConfirmHost` (mounted by <Renderer>)
// owns the pending-confirm state and the internal context; a host supplies only
// a stateless modal via the `defaultComponents.confirm` slot. The shadcn modal itself
// lives in `@ui-fired/shadcn-catalog` (tested there once that package grows a test
// harness).
const Modal = ({ open, message, onConfirm, onCancel }: ConfirmComponentProps) =>
  open ? (
    <div role="dialog">
      <p data-testid="message">{message}</p>
      <button type="button" onClick={onConfirm}>
        Confirm
      </button>
      <button type="button" onClick={onCancel}>
        Cancel
      </button>
    </div>
  ) : null;

const hostWith =
  (confirm?: typeof Modal) =>
  ({ children }: { children: ReactNode }) => (
    <ConfirmHost confirm={confirm}>{children}</ConfirmHost>
  );

describe("confirm", () => {
  const originalConfirm = window.confirm;
  afterEach(() => {
    window.confirm = originalConfirm;
  });

  it("defaults to window.confirm outside any host", async () => {
    const confirmMock = vi.fn(() => true);
    window.confirm = confirmMock;

    const { result } = renderHook(() => useConfirm());

    await expect(result.current("Delete?")).resolves.toBe(true);
    expect(confirmMock).toHaveBeenCalledWith("Delete?");
  });

  it("falls back to window.confirm when the host has no confirm component", async () => {
    const confirmMock = vi.fn(() => false);
    window.confirm = confirmMock;

    const { result } = renderHook(() => useConfirm(), {
      wrapper: hostWith(undefined),
    });

    await expect(result.current("Delete?")).resolves.toBe(false);
    expect(confirmMock).toHaveBeenCalledWith("Delete?");
  });

  it("resolves true through the host modal's Confirm button", async () => {
    const confirmMock = vi.fn(() => true);
    window.confirm = confirmMock;

    const { result } = renderHook(() => useConfirm(), {
      wrapper: hostWith(Modal),
    });

    let answer!: Promise<boolean>;
    act(() => {
      answer = result.current("Clear the pattern?");
    });

    expect(screen.getByTestId("message").textContent).toBe(
      "Clear the pattern?",
    );
    fireEvent.click(screen.getByText("Confirm"));

    await expect(answer).resolves.toBe(true);
    expect(confirmMock).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("resolves false through the host modal's Cancel button", async () => {
    const { result } = renderHook(() => useConfirm(), {
      wrapper: hostWith(Modal),
    });

    let answer!: Promise<boolean>;
    act(() => {
      answer = result.current("Reset the palette?");
    });
    fireEvent.click(screen.getByText("Cancel"));

    await expect(answer).resolves.toBe(false);
  });

  it("a newer confirm supersedes an unanswered one (resolves it false)", async () => {
    const { result } = renderHook(() => useConfirm(), {
      wrapper: hostWith(Modal),
    });

    let first!: Promise<boolean>;
    let second!: Promise<boolean>;
    act(() => {
      first = result.current("First?");
    });
    act(() => {
      second = result.current("Second?");
    });

    await expect(first).resolves.toBe(false);
    expect(screen.getByTestId("message").textContent).toBe("Second?");

    fireEvent.click(screen.getByText("Confirm"));
    await expect(second).resolves.toBe(true);
  });
});
