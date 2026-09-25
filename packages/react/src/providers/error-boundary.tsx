import { Component, type ReactElement, type ReactNode } from "react";
import { EntryError, type EntryErrorReason } from "@uicast/core";
import type { ErrorComponentProps } from "../types";

// Inline styles: no host CSS needed.
const DefaultErrorComponent = ({ error }: ErrorComponentProps) => (
  <div style={{ color: "red" }} data-key={error.elementKey}>
    Render error: {error.message}
  </div>
);

interface ErrorBoundaryProps {
  errorComponent?: (props: ErrorComponentProps) => ReactElement | null;
  elementKey?: string;
  // A latched error clears when this changes identity; a re-emitted key is a fresh entry object.
  resetToken?: unknown;
  onError?: (error: EntryError) => void;
  // What an unclassified throw from the children counts as.
  reason?: EntryErrorReason;
  children: ReactNode;
}

interface ErrorBoundaryState {
  caught: unknown;
  resetToken?: unknown;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { caught: null, resetToken: this.props.resetToken };
  private classified: { caught: unknown; error: EntryError } | null = null;

  static getDerivedStateFromError(error: unknown): Partial<ErrorBoundaryState> {
    return { caught: error };
  }

  // A classified EntryError passes through; anything else escaped uninstrumented code.
  private classify(caught: unknown): EntryError {
    const hit = this.classified;
    if (hit && hit.caught === caught) return hit.error;
    const error = EntryError.wrap(caught, this.props.reason ?? "unknown", this.props.elementKey);
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

  componentDidCatch(error: Error) {
    this.props.onError?.(this.classify(error));
  }

  render() {
    if (this.state.caught === null) return this.props.children;
    const error = this.classify(this.state.caught);

    const { errorComponent: ErrorComponent = DefaultErrorComponent } = this.props;
    return <ErrorComponent error={error} />;
  }
}
