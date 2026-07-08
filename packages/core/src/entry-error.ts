// The engine's classified error: every failure surfaced to the host — through
// the error slot or the Renderer's `onError` — is an EntryError. Classification
// happens at the throw site (by provenance: whose code raised it), never by
// inspecting messages. Reason names state the verdict, not the location.

export type EntryErrorReason =
  /** The expression doesn't parse. */
  | "expression-syntax"
  /** The expression uses syntax or reaches an API the sandbox blocks. */
  | "sandbox-violation"
  /** The expression references an identifier that doesn't exist — an unregistered function, a blocked-by-omission global, or an unknown scope path target. */
  | "unknown-reference"
  /** The element's `component` name has no implementation in the registry. */
  | "unknown-component"
  /** A list's `each` did not evaluate to an array, or a non-list element was rendered as a list. */
  | "invalid-list"
  /** The implementation's render threw, and the evaluated props FAIL the def's schema — the document sent a shape the contract forbids. */
  | "invalid-props"
  /** A host function rejected the arguments the document called it with (host functions throw this deliberately). */
  | "invalid-arguments"
  /** A host function threw or rejected while executing — server/host failure. */
  | "host-function"
  /** The host `init` callback threw or rejected. */
  | "host-init"
  /** The implementation's render threw on props its own def schema accepts — an implementation bug. */
  | "implementation"
  /** A valid expression threw at runtime (e.g. a property read through null) — the document wrote the path, but the host may have written the value. */
  | "expression-runtime"
  /** Escaped from an uninstrumented path — the defensive default. */
  | "unknown";

export type EntryFault = "document" | "environment" | "unknown";

// The single source of truth `fault` derives from — every reason maps to
// exactly one fault; hosts pick a side by picking the reason.
const FAULT_BY_REASON: Record<EntryErrorReason, EntryFault> = {
  "expression-syntax": "document",
  "sandbox-violation": "document",
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

export class EntryError extends Error {
  readonly reason: EntryErrorReason;
  /** The element the failure belongs to; the error boundary fills it in when the throw site couldn't. */
  elementKey?: string;
  // Brand marker: with git-dep consumption two copies of core can coexist in
  // one bundle, where `instanceof` silently fails — `EntryError.is()` checks
  // this instead.
  readonly uiFiredEntryError = true;

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

  /** Coarse verdict for recovery flows: `document` → ask the model to re-emit; `environment` → the host's problem; `unknown` → undecidable. */
  get fault(): EntryFault {
    return FAULT_BY_REASON[this.reason];
  }

  /** Cross-copy-safe `instanceof`. */
  static is(err: unknown): err is EntryError {
    return (
      typeof err === "object" &&
      err !== null &&
      (err as { uiFiredEntryError?: unknown }).uiFiredEntryError === true
    );
  }

  /**
   * Classify `err` as `reason`, keeping the original in `cause`. An error that
   * is already an EntryError passes through untouched (the deepest — most
   * precise — classification wins); a missing `elementKey` is filled in.
   */
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
