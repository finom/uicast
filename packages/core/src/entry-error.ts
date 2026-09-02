// The engine's classified error: every failure surfaced to the host — through
// the error slot or the Renderer's `onError` — is an EntryError. Classification
// happens at the throw site (by provenance: whose code raised it), never by
// inspecting messages. Reason names state the verdict, not the location.

export type EntryErrorReason =
  // The expression doesn't parse.
  | "expression-syntax"
  // The expression uses syntax or reaches an API the guardrail blocks, or a step's `set` path breaks a write rule (e.g. a numeric-key segment).
  | "guardrail-violation"
  // The expression references an identifier that doesn't exist — an unregistered function, a blocked-by-omission global, or an unknown scope path target.
  | "unknown-reference"
  // The element's `component` name has no implementation in the registry.
  | "unknown-component"
  // A list's `each` did not evaluate to an array, or a non-list element was rendered as a list.
  | "invalid-list"
  // The evaluated props fail the def's schema — the document sent a shape the contract forbids (caught before render runs).
  | "invalid-props"
  // A host function's input schema rejected the arguments the document called it with.
  | "invalid-arguments"
  // A host function threw or rejected while executing — server/host failure.
  | "host-function"
  // The host `init` callback threw or rejected.
  | "host-init"
  // The implementation's render threw on props its own def schema accepts — an implementation bug.
  | "implementation"
  // A valid expression threw at runtime (e.g. a property read through null) — the document wrote the path, but the host may have written the value.
  | "expression-runtime"
  // Escaped from an uninstrumented path — the defensive default.
  | "unknown";

export type EntryFault = "document" | "environment" | "unknown";

// The single source of truth `fault` derives from — every reason maps to
// exactly one fault; hosts pick a side by picking the reason.
export const FAULT_BY_REASON: Record<EntryErrorReason, EntryFault> = {
  "expression-syntax": "document",
  "guardrail-violation": "document",
  "unknown-reference": "document",
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

// One-line meaning per reason; `getErrorRecoveryPrompt` appends these to its
// failure lines so the model knows the failure class, not just the message.
export const REASON_DESCRIPTIONS: Record<EntryErrorReason, string> = {
  "expression-syntax": "the expression doesn't parse",
  "guardrail-violation":
    "the expression or a `set` path breaks a guardrail rule — blocked syntax or API, or exceeded the step, time, or allocation budget, or a numeric-key write target",
  "unknown-reference":
    "the expression references a name that doesn't exist — an unregistered function, a blocked global, or an unset scope path",
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
  // The element the failure belongs to; the error boundary fills it in when the throw site couldn't.
  elementKey?: string;
  // Brand marker: with git-dep consumption two copies of core can coexist in
  // one bundle, where `instanceof` silently fails — `EntryError.is()` checks
  // this instead.
  readonly uicastEntryError = true;

  constructor(
    message: string,
    options: { reason: EntryErrorReason; elementKey?: string; cause?: unknown },
  ) {
    super(
      message,
      options.cause !== undefined ? { cause: options.cause } : undefined,
    );
    this.name = "EntryError";
    this.reason = options.reason;
    this.elementKey = options.elementKey;
  }

  // Coarse verdict for recovery flows: `document` → ask the model to re-emit; `environment` → the host's problem; `unknown` → undecidable.
  get fault(): EntryFault {
    return FAULT_BY_REASON[this.reason];
  }

  // Cross-copy-safe `instanceof`.
  static is(err: unknown): err is EntryError {
    return (
      typeof err === "object" &&
      err !== null &&
      (err as { uicastEntryError?: unknown }).uicastEntryError === true
    );
  }

  // Classify `err` as `reason`, original in `cause`. An existing EntryError passes through; a missing `elementKey` is filled in.
  static wrap(
    err: unknown,
    reason: EntryErrorReason,
    elementKey?: string,
  ): EntryError {
    if (EntryError.is(err)) {
      if (elementKey && !err.elementKey) err.elementKey = elementKey;
      return err;
    }
    const message = err instanceof Error ? err.message : String(err);
    return new EntryError(message, { reason, elementKey, cause: err });
  }
}
