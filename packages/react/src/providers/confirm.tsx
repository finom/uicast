import {
  createContext,
  type ReactElement,
  type ReactNode,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import type { ConfirmComponentProps, ConfirmFn } from "../types";

const windowConfirm: ConfirmFn = (message) =>
  Promise.resolve(
    // No window means no way to ask; `confirm` guards destructive steps, so refuse.
    typeof window !== "undefined" ? window.confirm(message) : false,
  );

const ConfirmContext = createContext<ConfirmFn>(windowConfirm);

export const useConfirm = (): ConfirmFn => useContext(ConfirmContext);

type Pending = { message: string; resolve: (confirmed: boolean) => void };

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
    // A newer confirm resolves an unanswered one `false`, so its callback chain unblocks.
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
