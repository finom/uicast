"use client";
import type { ErrorComponentProps } from "@ui-fired/react";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";

// Shadcn `error` slot — shown when an element's render throws. Attach via
// `<RendererConfigProvider defaultComponents={{ error: RenderError }}>`.
export const RenderError = ({ error, elementKey }: ErrorComponentProps) => (
  <Alert variant="destructive" data-key={elementKey}>
    <AlertTitle>Render error</AlertTitle>
    <AlertDescription>{error.message}</AlertDescription>
  </Alert>
);
