"use client";
import React, { Component, type ReactNode } from "react";
import { EntryError } from "@uicast/core";
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
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: EntryError | null;
  resetToken?: unknown;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null, resetToken: this.props.resetToken };

  static getDerivedStateFromError(error: unknown): Partial<ErrorBoundaryState> {
    // Instrumented paths (evaluator, host functions, seeds, impls) throw
    // already-classified EntryErrors, which wrap() passes through; anything
    // else escaped uninstrumented code — the defensive "unknown".
    return { error: EntryError.wrap(error, "unknown") };
  }

  static getDerivedStateFromProps(
    props: ErrorBoundaryProps,
    state: ErrorBoundaryState,
  ): Partial<ErrorBoundaryState> | null {
    if (state.resetToken !== props.resetToken) {
      return { error: null, resetToken: props.resetToken };
    }
    return null;
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // State from getDerivedStateFromError is applied by now — this is the
    // same object the error slot renders and the one reported to the host.
    const entryError =
      this.state.error ?? EntryError.wrap(error, "unknown");
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
