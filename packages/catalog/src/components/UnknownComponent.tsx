"use client";
import type { UnknownComponentProps } from "@ui-fired/react";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";

/**
 * Shadcn-styled `components.unknown` slot — shown in place of an element whose
 * `component` name has no renderer in the catalog. Attach it manually:
 * `<Renderer components={{ unknown: UnknownComponent }}>`; without it the
 * engine falls back to a bare inline-styled div.
 */
export const UnknownComponent = ({
  componentName,
  elementKey,
}: UnknownComponentProps) => (
  <Alert className="border-dashed" data-key={elementKey}>
    <AlertTitle>Unknown component</AlertTitle>
    <AlertDescription>
      No renderer is registered for{" "}
      <code className="font-mono">{componentName}</code>.
    </AlertDescription>
  </Alert>
);
