import type { ExpressionErrorReason } from "@uicast/expr";

// Classified where thrown, by whose code raised it; never by inspecting messages.

export type EntryErrorReason =
  | ExpressionErrorReason
  | "invalid-entry"
  | "unknown-component"
  | "invalid-list"
  | "invalid-props"
  | "host-init"
  | "implementation"
  | "unknown";

export type EntryFault = "document" | "environment" | "unknown";

export const FAULT_BY_REASON: Record<EntryErrorReason, EntryFault> = {
  "expression-syntax": "document",
  "guardrail-violation": "document",
  "budget-exceeded": "document",
  "unknown-reference": "document",
  "invalid-entry": "document",
  "unknown-component": "document",
  "invalid-list": "document",
  "invalid-props": "document",
  "invalid-arguments": "document",
  "host-function": "environment",
  "host-init": "environment",
  implementation: "environment",
  "expression-runtime": "unknown",
  unknown: "unknown",
};

// Appended to the recovery prompt's failure lines.
export const REASON_DESCRIPTIONS: Record<EntryErrorReason, string> = {
  "expression-syntax": "the expression doesn't parse",
  "guardrail-violation":
    "the expression or a `set` path breaks a guardrail rule — blocked syntax or API, or a `set` that is not `scopes.<scope>.<field>`",
  "budget-exceeded": "the expression exceeded its step, time, or allocation budget",
  "unknown-reference":
    "the expression references a name that doesn't exist — an unregistered function, a blocked global, or an unset scope path",
  "invalid-entry": "a field of the line has the wrong type, like a `seed` that is not an array of steps",
  "unknown-component": "no component with this name exists",
  "invalid-list": "`each` didn't evaluate to an array",
  "invalid-props": "the evaluated props don't match the component's props schema",
  "invalid-arguments": "a host function rejected the call's arguments",
  "host-function": "a host function failed while executing",
  "host-init": "the host init callback failed",
  implementation: "the component implementation threw",
  "expression-runtime": "a valid expression threw at runtime",
  unknown: "unclassified failure",
};

export class EntryError extends Error {
  readonly reason: EntryErrorReason;
  // The error boundary fills it in when the throw site could not.
  elementKey?: string;
  // Brand: two copies of core can share a bundle (git-dep consumption), where `instanceof` fails.
  readonly uicastEntryError = true;

  constructor(message: string, options: { reason: EntryErrorReason; elementKey?: string; cause?: unknown }) {
    super(message, options.cause !== undefined ? { cause: options.cause } : undefined);
    this.name = "EntryError";
    this.reason = options.reason;
    this.elementKey = options.elementKey;
  }

  // `document`: ask the model to re-emit; `environment`: the host's problem.
  get fault(): EntryFault {
    return FAULT_BY_REASON[this.reason];
  }

  // Cross-copy-safe `instanceof`.
  static is(err: unknown): err is EntryError {
    return typeof err === "object" && err !== null && (err as { uicastEntryError?: unknown }).uicastEntryError === true;
  }

  // An existing EntryError passes through.
  static wrap(err: unknown, reason: EntryErrorReason, elementKey?: string): EntryError {
    if (EntryError.is(err)) {
      if (elementKey && !err.elementKey) err.elementKey = elementKey;
      return err;
    }
    const message = err instanceof Error ? err.message : String(err);
    return new EntryError(message, { reason, elementKey, cause: err });
  }
}
