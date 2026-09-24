"use client";
import type { ErrorComponentProps } from "@uicast/react";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";

// `<RendererProvider fallbackComponents={{ error: RenderError }}>`.
export const RenderError = ({ error }: ErrorComponentProps) => (
  <Alert variant="destructive" data-key={error.elementKey}>
    <AlertTitle>Render error</AlertTitle>
    <AlertDescription>{error.message}</AlertDescription>
  </Alert>
);
