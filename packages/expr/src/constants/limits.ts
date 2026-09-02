// Every cap the language enforces, in one place.

// Longest accepted source, in characters. The real corpus tops out around 140; anything near this belongs in a host function.
export const DEFAULT_MAX_SOURCE_LENGTH = 1000;

// Deepest AST the validator and the compilers walk — a nested expression cannot blow their stack.
export const MAX_AST_DEPTH = 100;

// Arrow parameters — the interpreter's call slots. The method tables pass at most four (`reduce`).
export const MAX_ARROW_PARAMS = 5;

// Nested callback invocations before `budget-exceeded`. Self-application is the one recursion the grammar cannot forbid, and it blows the stack before the step budget reacts.
export const MAX_CALLBACK_DEPTH = 64;

// `.flat()` depth, so a pathologically nested host value cannot overflow the stack.
export const MAX_FLAT_DEPTH = 32;

// Deepest value the exit gate walks before refusing it.
export const MAX_DATA_DEPTH = 256;

export type BudgetOptions = {
	// Evaluation steps before `budget-exceeded`. Default 1_000_000.
	steps?: number;
	// Wall-clock milliseconds before `budget-exceeded`. Default 100.
	ms?: number;
	// Longest string any operation may produce. Default 1_000_000.
	maxStringLength?: number;
	// Longest array any operation may produce. Default 100_000.
	maxArrayLength?: number;
	// Total characters + elements one evaluation may allocate across ALL operations. Default 10_000_000 — per-op caps don't compose, so the total is bounded too.
	maxTotalAllocation?: number;
};

export const DEFAULT_BUDGET: Required<BudgetOptions> = {
	steps: 1_000_000,
	ms: 100,
	maxStringLength: 1_000_000,
	maxArrayLength: 100_000,
	maxTotalAllocation: 10_000_000,
};
