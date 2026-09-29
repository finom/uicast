"use client";

import type { EntryError } from "@uicast/core";
import { Alert, AlertTitle } from "@uicast/shadcn-catalog/ui/alert";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

// The status icons and colors of the catalog's Alert, so these match the toasts a model writes.
const KINDS = {
  success: { Icon: CheckCircle2, color: "*:[svg]:text-success" },
  error: { Icon: AlertCircle, color: "*:[svg]:text-destructive" },
  info: { Icon: Info, color: "*:[svg]:text-info" },
};
type ToastKind = keyof typeof KINDS;
type Toast = { id: number; message: string; kind: ToastKind };
const MAX_TOASTS = 4;
const TOAST_MS = 5000;
let nextId = 1;
let push: ((message: string, kind: ToastKind) => void) | null = null;

export function showToast(message: string, kind: ToastKind = "info") {
  push?.(message, kind);
}

// A callback failure has no error slot, so the server's own message flashes instead.
export function toastCallbackFailure(error: EntryError) {
  if (error.reason === "host-function" || error.reason === "invalid-arguments") {
    showToast(error.message.replace(/^[^:]*: */, ""), "error");
  }
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  useEffect(() => {
    push = (message, kind) => {
      const id = nextId++;
      setToasts((prev) => [...prev, { id, message, kind }].slice(-MAX_TOASTS));
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), TOAST_MS);
    };
    return () => {
      push = null;
    };
  }, []);
  if (toasts.length === 0) return null;
  return (
    <div className="pointer-events-none fixed bottom-4 left-1/2 z-50 flex w-full max-w-md -translate-x-1/2 flex-col gap-2 px-4">
      {toasts.map(({ id, message, kind }) => {
        const { Icon, color } = KINDS[kind];
        return (
          <Alert key={id} className={cn("pointer-events-auto shadow-lg", color)}>
            <Icon />
            <AlertTitle>{message}</AlertTitle>
          </Alert>
        );
      })}
    </div>
  );
}
