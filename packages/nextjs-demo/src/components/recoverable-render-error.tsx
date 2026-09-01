"use client";
import { LoaderCircle, RefreshCw } from "lucide-react";
import { useState } from "react";
import type { ErrorComponentProps } from "@uicast/react";
import { Alert, AlertDescription, AlertTitle } from "@uicast/shadcn-catalog/ui/alert";
import { Button } from "@uicast/shadcn-catalog/ui/button";

// Demo `error` slot: the catalog's RenderError look plus a Recover button —
// the user-triggered recovery flow. `onRecover` sends the failure back to the
// model (page: a recovery run, chat: a chat message); the slot unmounts by
// itself when the corrected element streams in, since partial replacement
// resets the element's error boundary. Recover only shows when re-emission
// can plausibly help: an `environment` fault is host code failing — the model
// can't fix the server.
export function RecoverableRenderError({
  error,
  elementKey,
  onRecover,
}: ErrorComponentProps & { onRecover?: () => void | Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const recoverable = error.fault !== "environment";
  return (
    <Alert variant="destructive" data-key={elementKey}>
      <AlertTitle>Render error</AlertTitle>
      <AlertDescription>
        {error.message}
        {onRecover && recoverable && (
          <div className="mt-2">
            <Button
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await onRecover();
                } finally {
                  setBusy(false);
                }
              }}
            >
              {busy ? (
                <LoaderCircle data-icon="inline-start" className="animate-spin" />
              ) : (
                <RefreshCw data-icon="inline-start" />
              )}
              Recover
            </Button>
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}
