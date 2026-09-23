"use client";

import type { EntryError } from "@uicast/core";
import { useEffect, useState } from "react";

type Toast = { id: number; message: string };
const MAX_TOASTS = 4;
const TOAST_MS = 5000;
let nextId = 1;
let push: ((message: string) => void) | null = null;

export function showToast(message: string) {
  push?.(message);
}

// A callback failure has no error slot, so the server's own message flashes instead.
export function toastCallbackFailure(error: EntryError) {
  if (error.reason === "host-function" || error.reason === "invalid-arguments") {
    showToast(error.message.replace(/^[^:]*: */, ""));
  }
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  useEffect(() => {
    push = (message) => {
      const id = nextId++;
      setToasts((prev) => [...prev, { id, message }].slice(-MAX_TOASTS));
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), TOAST_MS);
    };
    return () => {
      push = null;
    };
  }, []);
  if (toasts.length === 0) return null;
  return (
    <div className="pointer-events-none fixed bottom-4 left-1/2 z-50 flex w-full max-w-md -translate-x-1/2 flex-col gap-2 px-4">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto rounded-md border bg-card px-4 py-3 text-sm text-card-foreground shadow-lg"
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
