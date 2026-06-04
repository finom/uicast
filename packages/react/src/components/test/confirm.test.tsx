import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ConfirmProvider, useConfirm } from "../confirm";

// The confirm flow's SYSTEM half: react ships only the context + hook, with a
// `window.confirm` default so the engine needs zero UI deps. The shadcn modal
// that used to live here moved to `@ui-fired/catalog` (tested there once that
// package grows a test harness).
describe("useConfirm", () => {
  const originalConfirm = window.confirm;
  afterEach(() => {
    window.confirm = originalConfirm;
  });

  it("defaults to window.confirm when no provider is present", async () => {
    const confirmMock = vi.fn(() => true);
    window.confirm = confirmMock;

    const { result } = renderHook(() => useConfirm());

    await expect(result.current("Delete?")).resolves.toBe(true);
    expect(confirmMock).toHaveBeenCalledWith("Delete?");

    confirmMock.mockReturnValue(false);
    await expect(result.current("Delete?")).resolves.toBe(false);
  });

  it("ConfirmProvider overrides the default", async () => {
    const custom = vi.fn(async (_message: string) => true);
    const { result } = renderHook(() => useConfirm(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <ConfirmProvider value={custom}>{children}</ConfirmProvider>
      ),
    });

    await expect(result.current("Sure?")).resolves.toBe(true);
    expect(custom).toHaveBeenCalledWith("Sure?");
  });
});
