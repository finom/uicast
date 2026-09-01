"use client";

import { useEffect, useState } from "react";

// Minimal app-level toasts: module bus + one fixed stack, 5s auto-dismiss.
// Used for callback failures inside generated UI (e.g. a write rejected on a
// read-only view) — the element stays, the server's message flashes.

type Toast = { id: number; message: string };
let nextId = 1;
let push: ((message: string) => void) | null = null;

export function showToast(message: string) {
  push?.(message);
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  useEffect(() => {
    push = (message) => {
      const id = nextId++;
      setToasts((prev) => [...prev.slice(-3), { id, message }]);
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
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
