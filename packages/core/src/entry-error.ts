import type { ExpressionErrorReason } from "@uicast/expr";

// Classified where thrown, by whose code raised it; never by inspecting messages.

/**
 * What failed: an expression's refusal or failure (an `ExpressionErrorReason`), or an element-level one.
 *
 * @example
 * if (error.reason === "unknown-component") return <p>No implementation for {error.elementKey}</p>;
 */
export type EntryErrorReason =
  | ExpressionErrorReason
  | "invalid-entry"
  | "unknown-component"
  | "invalid-list"
  | "invalid-props"
  | "host-init"
  | "implementation"
  | "unknown";

/**
 * Whose code must fix a failure: `"document"` the model's (re-emit the entry), `"environment"` the host's, `"unknown"`
 * either.
 *
 * @example
 * const fault: EntryFault = error.fault; // "document" for reason "invalid-props"
 */
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
  "expression-syntax": "expression doesn't parse",
  "guardrail-violation": "breaks guardrail rule: blocked syntax or API, or `set` not `scopes.<scope>.<field>`",
  "budget-exceeded": "expression passed its step, time or allocation budget",
  "unknown-reference": "name doesn't exist: unregistered function, blocked global, or unset scope path",
  "invalid-entry": "line field has wrong type, like `seed` not array of steps",
  "unknown-component": "no component with this name",
  "invalid-list": "`each` not array, or `as` names existing scope",
  "invalid-props": "evaluated props don't match component's props schema",
  "invalid-arguments": "host function rejected call's arguments",
  "host-function": "host function failed",
  "host-init": "host init callback failed",
  implementation: "component implementation threw",
  "expression-runtime": "valid expression threw at runtime",
  unknown: "unclassified failure",
};

/**
 * The classified error every element failure arrives as, in the error slot and in `onError`. `reason` says what
 * failed; `fault` says whose code must fix it.
 *
 * @example
 * const onError = (error: EntryError) =>
 *   error.fault === "document" ? askModelToFix(error.elementKey, error.message) : report(error);
 */
export class EntryError extends Error {
  /** What failed, e.g. `"invalid-props"`. */
  readonly reason: EntryErrorReason;
  /** The key of the element that failed. The error boundary fills it in when the throw site could not. */
  elementKey?: string;
  /** Brand for `EntryError.is`: `instanceof` fails when two copies of this package share a bundle. */
  readonly uicastEntryError = true;

  constructor(message: string, options: { reason: EntryErrorReason; elementKey?: string; cause?: unknown }) {
    super(message, options.cause !== undefined ? { cause: options.cause } : undefined);
    this.name = "EntryError";
    this.reason = options.reason;
    this.elementKey = options.elementKey;
  }

  /** Whose code must fix it: `"document"` (the model, by re-emitting), `"environment"` (host code) or `"unknown"`. */
  get fault(): EntryFault {
    return FAULT_BY_REASON[this.reason];
  }

  /**
   * Whether `err` is an `EntryError`, from any copy of this package. Use it over `instanceof`.
   *
   * @example
   * if (EntryError.is(err)) console.warn(err.reason, err.elementKey);
   */
  static is(err: unknown): err is EntryError {
    return typeof err === "object" && err !== null && (err as { uicastEntryError?: unknown }).uicastEntryError === true;
  }

  /**
   * Turns any thrown value into an `EntryError` with this `reason`. An `EntryError` passes through as is, and gets
   * `elementKey` if it had none.
   *
   * @example
   * const error = EntryError.wrap(err, "implementation", "orders-table");
   * error.fault; // "environment"
   */
  static wrap(err: unknown, reason: EntryErrorReason, elementKey?: string): EntryError {
    if (EntryError.is(err)) {
      if (elementKey && !err.elementKey) err.elementKey = elementKey;
      return err;
    }
    const message = err instanceof Error ? err.message : String(err);
    return new EntryError(message, { reason, elementKey, cause: err });
  }
}
