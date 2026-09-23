"use client";
import { RefreshCw } from "lucide-react";
import type { ErrorComponentProps } from "@uicast/react";
import { Alert, AlertDescription, AlertTitle } from "@uicast/shadcn-catalog/ui/alert";
import { Button } from "@uicast/shadcn-catalog/ui/button";

// The slot unmounts by itself when the corrected element streams in. Recover hides on an `environment` fault:
// host code failing is not the model's to fix.
export function RecoverableRenderError({
  error,
  elementKey,
  onRecover,
}: ErrorComponentProps & { onRecover?: () => void }) {
  const recoverable = error.fault !== "environment";
  return (
    <Alert variant="destructive" data-key={elementKey}>
      <AlertTitle>Render error</AlertTitle>
      <AlertDescription>
        {error.message}
        {onRecover && recoverable && (
          <div className="mt-2">
            <Button variant="outline" size="sm" onClick={onRecover}>
              <RefreshCw data-icon="inline-start" />
              Recover
            </Button>
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}
