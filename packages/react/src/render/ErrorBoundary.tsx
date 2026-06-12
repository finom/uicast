"use client";
import React, { Component, type ReactNode } from "react";
import type { ErrorComponentProps } from "./RendererRegistry";

// Zero-dependency default for the `components.error` slot: a bare inline-styled
// div, so it renders sensibly without Tailwind or any host CSS. The
// shadcn-styled version ships in @ui-fired/catalog (`RenderError`).
export const DefaultErrorComponent = ({
  error,
  elementKey,
}: ErrorComponentProps) => (
  <div style={{ color: "red" }} data-key={elementKey}>
    Render error: {error.message}
  </div>
);

interface ErrorBoundaryProps {
  // Static-node escape hatch for direct consumers. `errorComponent` (the
  // engine's `components.error` slot) wins when both are set — it receives the
  // caught error.
  fallback?: ReactNode;
  errorComponent?: (props: ErrorComponentProps) => React.ReactElement | null;
  elementKey?: string;
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    // Renderers can throw anything; normalize so the slot always gets an Error.
    return {
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(
      "RecursiveRenderer error boundary caught an error:",
      error,
      errorInfo,
    );
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const { errorComponent: ErrorComponent, fallback, elementKey } = this.props;
    if (ErrorComponent) {
      return <ErrorComponent error={error} elementKey={elementKey} />;
    }
    if (fallback !== undefined) return fallback;
    return <DefaultErrorComponent error={error} elementKey={elementKey} />;
  }
}
