"use client";
import { ConfirmProvider, type ConfirmFn } from "@ui-fired/react";
import { type ReactNode, useCallback, useRef, useState } from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

/**
 * Shadcn-styled confirm modal — the plug-and-play VISUAL half of the confirm
 * flow, and an example of how to override `@ui-fired/react`'s system default.
 *
 * Wrap a subtree in `<ConfirmModalProvider>` and every `confirm:` carried by a
 * generated callback resolves through this dialog instead of the browser-native
 * `window.confirm`. It feeds its promise-based confirm fn into react's
 * `ConfirmProvider`, which is exactly what the renderer's `useConfirm()` reads.
 * Bring your own provider (or omit this one) to use a different modal.
 */
export const ConfirmModalProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((msg: string) => {
    setMessage(msg);
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  const handleConfirm = useCallback(() => {
    setOpen(false);
    resolveRef.current?.(true);
    resolveRef.current = null;
  }, []);

  const handleCancel = useCallback(() => {
    setOpen(false);
    resolveRef.current?.(false);
    resolveRef.current = null;
  }, []);

  return (
    <ConfirmProvider value={confirm}>
      {children}
      <Dialog open={open} onOpenChange={(v) => !v && handleCancel()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Action</DialogTitle>
            <DialogDescription>{message}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirm}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ConfirmProvider>
  );
};
