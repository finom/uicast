"use client";
import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";

type ConfirmFn = (message: string) => Promise<boolean>;

const ConfirmModalContext = createContext<ConfirmFn | null>(null);

export const useConfirm = (): ConfirmFn => {
  const confirm = useContext(ConfirmModalContext);
  if (!confirm) {
    throw new Error("useConfirm must be used within a ConfirmModalProvider");
  }
  return confirm;
};

export const ConfirmModalProvider = ({
  children,
}: {
  children: React.ReactNode;
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
    <ConfirmModalContext.Provider value={confirm}>
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
    </ConfirmModalContext.Provider>
  );
};
