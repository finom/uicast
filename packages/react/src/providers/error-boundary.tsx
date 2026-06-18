"use client";
import React, { Component, type ReactNode } from "react";
import type { ErrorComponentProps } from "../types";

// Default for the `error` slot: a bare inline-styled div, no host CSS needed.
// The shadcn version ships in @ui-fired/shadcn-catalog (`RenderError`).
export const DefaultErrorComponent = ({
  error,
  elementKey,
}: ErrorComponentProps) => (
  <div style={{ color: "red" }} data-key={elementKey}>
    Render error: {error.message}
  </div>
);

interface ErrorBoundaryProps {
  // Escape hatch for direct consumers; `errorComponent` wins when both are set.
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
    return {
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(
      "EntryRenderer error boundary caught an error:",
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
