"use client";
import type { ErrorComponentProps } from "@ui-fired/react";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";

/**
 * Shadcn-styled `components.error` slot — shown in place of an element whose
 * render threw. Attach it manually:
 * `<Renderer components={{ error: RenderError }}>`; without it the engine
 * falls back to a bare inline-styled div.
 */
export const RenderError = ({ error, elementKey }: ErrorComponentProps) => (
  <Alert variant="destructive" data-key={elementKey}>
    <AlertTitle>Render error</AlertTitle>
    <AlertDescription>{error.message}</AlertDescription>
  </Alert>
);
