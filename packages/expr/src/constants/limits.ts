// The corpus tops out around 140 characters; anything near this belongs in a host function.
export const DEFAULT_MAX_SOURCE_LENGTH = 1000;

export const DEFAULT_MAX_CACHE_SIZE = 500;

// A nested expression cannot blow the validator's or a compiler's stack.
export const MAX_AST_DEPTH = 100;

// The interpreter's call slots; the method tables pass at most four (`reduce`).
export const MAX_ARROW_PARAMS = 5;

// Distinct locale-and-options pairs kept per Intl kind.
export const INTL_CACHE_SIZE = 64;

// Characters the engine scans or copies for one step.
export const CHARS_PER_STEP = 64;

// Characters the engine rewrites or builds one by one for one step: case, normalization, JSON, parsing.
export const TEXT_CHARS_PER_STEP = 4;

// Allocating is time too: a new string costs a step per 2^10 characters, a new array a step per 2^3 items.
export const STRING_ALLOCATION_SHIFT = 10;
export const ARRAY_ALLOCATION_SHIFT = 3;

// Steps an operation costs beyond its written nodes: its time over a plain step's, as
// test/prices.test.ts measures it. So the step limit, not the clock, ends a long evaluation on any device.
export const PRICES = Object.freeze({
  // Any method or global function call, before its own work.
  call: 2,
  // A number formatted or two strings compared through a locale.
  locale: 32,
  // Building an Intl object, per locale tag it reads: charged once per distinct locale and options in an evaluation.
  intlBuild: 2_000,
  // A date read from text (plus a step per character).
  dateText: 64,
  // An item hashed into its group by Object.groupBy.
  hash: 4,
  // A number added by Math.sumPrecise, or rounded by Math.f16round.
  exactNumber: 8,
  // A JSON.parse or JSON.stringify call, before its size.
  json: 32,
});

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
  /** Evaluation steps: each node is a step, and a call adds its work (a sort about n·log n). Default 1_000_000. */
  steps?: number;
  /** Wall-clock milliseconds, a backstop to `steps`. Default 100. */
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
