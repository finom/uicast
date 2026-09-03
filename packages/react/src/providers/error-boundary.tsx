"use client";
import React, { Component, type ReactNode } from "react";
import { EntryError, type EntryErrorReason } from "@uicast/core";
import type { ErrorComponentProps } from "../types";

// Default for the `error` slot: a bare inline-styled div, no host CSS needed.
// The shadcn version ships in @uicast/shadcn-catalog (`RenderError`).
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
  // A latched error clears when this value changes identity. The renderer
  // passes the entry object — the stream produces a fresh object per parsed
  // line, so a re-emitted key (partial replacement) gets a fresh render
  // attempt instead of staying stuck on the old error.
  resetToken?: unknown;
  // Reported once per caught error, after classification.
  onError?: (error: EntryError) => void;
  // What an unclassified throw from the children counts as. Default "unknown".
  reason?: EntryErrorReason;
  children: ReactNode;
}

interface ErrorBoundaryState {
  caught: unknown;
  resetToken?: unknown;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { caught: null, resetToken: this.props.resetToken };
  private classified: { caught: unknown; error: EntryError } | null = null;

  static getDerivedStateFromError(error: unknown): Partial<ErrorBoundaryState> {
    return { caught: error };
  }

  // Instrumented paths (evaluator, host functions, seeds) throw classified
  // EntryErrors, which wrap() passes through; anything else escaped
  // uninstrumented code and gets the caller's `reason`.
  private classify(caught: unknown): EntryError {
    const hit = this.classified;
    if (hit && hit.caught === caught) return hit.error;
    const error = EntryError.wrap(caught, this.props.reason ?? "unknown");
    this.classified = { caught, error };
    return error;
  }

  static getDerivedStateFromProps(
    props: ErrorBoundaryProps,
    state: ErrorBoundaryState,
  ): Partial<ErrorBoundaryState> | null {
    if (state.resetToken !== props.resetToken) {
      return { caught: null, resetToken: props.resetToken };
    }
    return null;
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // The same object the error slot renders.
    const entryError = this.classify(this.state.caught ?? error);
    if (!entryError.elementKey && this.props.elementKey) {
      entryError.elementKey = this.props.elementKey;
    }
    this.props.onError?.(entryError);
    console.error(
      "EntryRenderer error boundary caught an error:",
      error,
      errorInfo,
    );
  }

  render() {
    if (this.state.caught === null) return this.props.children;
    const error = this.classify(this.state.caught);

    const { errorComponent: ErrorComponent, fallback, elementKey } = this.props;
    if (ErrorComponent) {
      return <ErrorComponent error={error} elementKey={elementKey} />;
    }
    if (fallback !== undefined) return fallback;
    return <DefaultErrorComponent error={error} elementKey={elementKey} />;
  }
}
