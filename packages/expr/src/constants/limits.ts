// The corpus tops out around 140 characters; anything near this belongs in a host function.
export const DEFAULT_MAX_SOURCE_LENGTH = 1000;

export const DEFAULT_MAX_CACHE_SIZE = 500;

// A nested expression cannot blow the validator's or a compiler's stack.
export const MAX_AST_DEPTH = 100;

// The interpreter's call slots; the method tables pass at most four (`reduce`).
export const MAX_ARROW_PARAMS = 5;

// Distinct locale-and-options pairs kept per Intl kind.
export const INTL_CACHE_SIZE = 64;

// A built-in costs a step per item it walks or builds, and a step per this many characters it reads or writes.
// The counts are rough: the clock, not the step limit, bounds time.
export const CHARS_PER_STEP = 16;

// Longest run of combining marks normalize and localeCompare take: putting a run in order takes time of its square.
// Unicode's stream-safe text (UAX #15) has no longer runs.
export const MAX_MARK_RUN = 30;

// A pathologically nested host value cannot overflow the stack.
export const MAX_FLAT_DEPTH = 32;

// Deepest value the exit gate walks before refusing it.
export const MAX_DATA_DEPTH = 256;

/**
 * Limits for one evaluation. An evaluation that goes past one throws an `ExpressionError` with reason
 * `budget-exceeded`.
 *
 * @example
 * new Evaluator({ budget: { steps: 200_000, ms: 50 } });
 */
export type BudgetOptions = {
  /**
   * Steps of work: each node, each item a built-in walks or builds, and every 16 characters it reads or writes.
   * Default 1_000_000.
   */
  steps?: number;
  /** Wall-clock milliseconds, checked every 2048 steps and after each formatter build. Default 100. */
  ms?: number;
  /** Longest string any operation may produce. Default 1_000_000. */
  maxStringLength?: number;
  /** Longest array any operation may produce. Default 100_000. */
  maxArrayLength?: number;
  /** Characters and array items built in one evaluation, all operations together. Default 10_000_000. */
  maxTotalAllocation?: number;
};

export const DEFAULT_BUDGET: Required<BudgetOptions> = {
  steps: 1_000_000,
  ms: 100,
  maxStringLength: 1_000_000,
  maxArrayLength: 100_000,
  maxTotalAllocation: 10_000_000,
};
