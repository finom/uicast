"use client";
import type { UnknownComponentProps } from "@ui-fired/react";
import { Alert, AlertDescription, AlertTitle } from "@ui-fired/catalog/components/ui/alert";

// Shadcn `unknown` slot — shown when an element's `component` name has no catalog
// match. Attach via `<Renderer overrides={{ unknown: UnknownComponent }}>`.
export const UnknownComponent = ({
  componentName,
  elementKey,
}: UnknownComponentProps) => (
  <Alert className="border-dashed" data-key={elementKey}>
    <AlertTitle>Unknown component</AlertTitle>
    <AlertDescription>
      No implementation is registered for{" "}
      <code className="font-mono">{componentName}</code>.
    </AlertDescription>
  </Alert>
);
