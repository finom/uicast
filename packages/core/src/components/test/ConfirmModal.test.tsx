import { act, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { ConfirmModalProvider, useConfirm } from "../ConfirmModal";

function Harness({
  message,
  onResolve,
}: {
  message: string;
  onResolve: (result: boolean | null) => void;
}) {
  const confirm = useConfirm();
  const [last, setLast] = useState<string>("idle");
  return (
    <button
      type="button"
      onClick={async () => {
        setLast("asking");
        const result = await confirm(message);
        setLast(result ? "yes" : "no");
        onResolve(result);
      }}
    >
      {last}
    </button>
  );
}

describe("ConfirmModalProvider + useConfirm", () => {
  it("throws when useConfirm is used without a provider", () => {
    const Bare = () => {
      useConfirm();
      return null;
    };
    // React 19 will surface the throw — happy-dom renders it as a thrown error
    // synchronously during the render. We catch via render(...) wrapped in
    // expect.
    expect(() => render(<Bare />)).toThrow(/ConfirmModalProvider/);
  });

  it("resolves to true on Confirm", async () => {
    const results: (boolean | null)[] = [];
    render(
      <ConfirmModalProvider>
        <Harness message="Sure?" onResolve={(r) => results.push(r)} />
      </ConfirmModalProvider>,
    );

    const trigger = screen.getByText("idle");
    await act(async () => {
      fireEvent.click(trigger);
    });
    // Dialog is open — find the Confirm button by text.
    const confirmBtn = await screen.findByText("Confirm");
    await act(async () => {
      fireEvent.click(confirmBtn);
    });
    expect(results).toEqual([true]);
  });

  it("resolves to false on Cancel", async () => {
    const results: (boolean | null)[] = [];
    render(
      <ConfirmModalProvider>
        <Harness message="Sure?" onResolve={(r) => results.push(r)} />
      </ConfirmModalProvider>,
    );

    const trigger = screen.getByText("idle");
    await act(async () => {
      fireEvent.click(trigger);
    });
    const cancelBtn = await screen.findByText("Cancel");
    await act(async () => {
      fireEvent.click(cancelBtn);
    });
    expect(results).toEqual([false]);
  });
});
