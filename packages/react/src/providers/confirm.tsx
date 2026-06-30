"use client";
import {
  createContext,
  type ReactElement,
  type ReactNode,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import type { ConfirmComponentProps } from "../types";

// A callback step carrying `confirm:` awaits this before running. It resolves
// through the host modal when one is supplied via `defaultComponents.confirm`, else
// `window.confirm` — so the engine has no UI dependency.
export type ConfirmFn = (message: string) => Promise<boolean>;

const windowConfirm: ConfirmFn = (message) =>
  Promise.resolve(
    typeof window !== "undefined" ? window.confirm(message) : true,
  );

const ConfirmContext = createContext<ConfirmFn>(windowConfirm);

/** The active confirm fn — `window.confirm` unless a host modal is mounted. */
export const useConfirm = (): ConfirmFn => useContext(ConfirmContext);

type Pending = { message: string; resolve: (confirmed: boolean) => void };

// Owns the pending-confirm state: `confirm()` parks a `Promise.withResolvers()`
// pair in state, the modal's buttons settle it.
export const ConfirmHost = ({
  confirm: Confirm,
  children,
}: {
  confirm?: (props: ConfirmComponentProps) => ReactElement | null;
  children: ReactNode;
}) => {
  const [pending, setPending] = useState<Pending | null>(null);

  // Outlives `pending` so the dialog text doesn't blank mid-close-animation.
  const lastMessage = useRef("");
  if (pending) lastMessage.current = pending.message;

  const modalConfirm = useCallback<ConfirmFn>((message) => {
    const { promise, resolve } = Promise.withResolvers<boolean>();
    // A newer confirm supersedes an unanswered one — resolve it `false` so its
    // awaiting callback chain unblocks instead of hanging forever.
    setPending((prev) => {
      prev?.resolve(false);
      return { message, resolve };
    });
    return promise;
  }, []);

  const settle = (confirmed: boolean) => {
    pending?.resolve(confirmed);
    setPending(null);
  };

  return (
    <ConfirmContext.Provider value={Confirm ? modalConfirm : windowConfirm}>
      {children}
      {Confirm && (
        <Confirm
          open={pending !== null}
          message={lastMessage.current}
          onConfirm={() => settle(true)}
          onCancel={() => settle(false)}
        />
      )}
    </ConfirmContext.Provider>
  );
};
