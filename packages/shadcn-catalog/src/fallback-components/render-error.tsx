"use client";
import type { ErrorComponentProps } from "@uicast/react";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";

/**
 * A destructive shadcn alert with the error's message, for `fallbackComponents.error`.
 *
 * @example
 * const fallbackComponents: FallbackComponents = { error: RenderError };
 */
export const RenderError = ({ error }: ErrorComponentProps) => (
  <Alert variant="destructive" data-key={error.elementKey}>
    <AlertTitle>Render error</AlertTitle>
    <AlertDescription>{error.message}</AlertDescription>
  </Alert>
);
