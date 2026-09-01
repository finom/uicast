import { ExpressionError } from "./errors";

// The CPU and allocation ceiling. Every iterating built-in is implemented in
// this package, so each iteration ticks and each allocation is capped;
// straight-line work is charged statically per callback invocation.
// `Date.now` is captured at module load so evaluated code cannot move it.

const now = Date.now;

export type BudgetOptions = {
	/** Evaluation steps before `budget-exceeded`. Default 1_000_000. */
	steps?: number;
	/** Wall-clock milliseconds before `budget-exceeded`. Default 100. */
	ms?: number;
	/** Longest string any operation may produce. Default 1_000_000. */
	maxStringLength?: number;
	/** Longest array any operation may produce. Default 100_000. */
	maxArrayLength?: number;
	/** Total characters + elements one evaluation may allocate across ALL operations. Default 10_000_000 — per-op caps don't compose, so the total is bounded too. */
	maxTotalAllocation?: number;
};

export const DEFAULT_BUDGET: Required<BudgetOptions> = {
	steps: 1_000_000,
	ms: 100,
	maxStringLength: 1_000_000,
	maxArrayLength: 100_000,
	maxTotalAllocation: 10_000_000,
};

/** How often the wall clock is consulted — reading it every step costs more than the step. */
const CLOCK_EVERY = 2_048;

/**
 * Plain fields, not private ones: this is the hottest object in the package and
 * it never leaves it.
 */
export class Budget {
	readonly maxStringLength: number;
	readonly maxArrayLength: number;
	steps = 0;
	/** Live callback-invocation depth — see {@link enter}. */
	depth = 0;
	/** Characters plus array elements produced so far, across every operation. */
	allocated = 0;
	private maxAllocation: number;
	private limit: number;
	private ms: number;
	// Started lazily, on the first clock check. Most expressions never reach
	// CLOCK_EVERY steps, so most evaluations never read the clock at all — which
	// matters when a dependency wave evaluates a few thousand of them.
	private startedAt = 0;
	private nextClockCheck = CLOCK_EVERY;

	constructor(options: BudgetOptions = {}) {
		this.limit = options.steps ?? DEFAULT_BUDGET.steps;
		this.ms = options.ms ?? DEFAULT_BUDGET.ms;
		this.maxStringLength = options.maxStringLength ?? DEFAULT_BUDGET.maxStringLength;
		this.maxArrayLength = options.maxArrayLength ?? DEFAULT_BUDGET.maxArrayLength;
		this.maxAllocation = options.maxTotalAllocation ?? DEFAULT_BUDGET.maxTotalAllocation;
	}

	/** Charge the running allocation total, and stop when it runs out. */
	private allocate(units: number): void {
		this.allocated += units;
		if (this.allocated > this.maxAllocation) {
			throw new ExpressionError(
				`Expression exceeded its total allocation budget (${this.maxAllocation} units)`,
				"budget-exceeded",
			);
		}
	}

	tick(cost: number): void {
		this.steps += cost;
		if (this.steps >= this.limit) {
			throw new ExpressionError(
				`Expression exceeded its step budget (${this.limit} steps)`,
				"budget-exceeded",
			);
		}
		if (this.steps >= this.nextClockCheck) {
			this.nextClockCheck = this.steps + CLOCK_EVERY;
			const t = now();
			if (this.startedAt === 0) this.startedAt = t;
			else if (t - this.startedAt > this.ms) {
				throw new ExpressionError(
					"Expression exceeded its time budget",
					"budget-exceeded",
				);
			}
		}
	}

	/** Guard a string an operation is about to produce. */
	string(length: number): void {
		if (length > this.maxStringLength) {
			throw new ExpressionError(
				`Expression tried to build a string of ${length} characters (limit ${this.maxStringLength})`,
				"budget-exceeded",
			);
		}
		this.allocate(length);
		this.tick(1 + (length >> 10));
	}

	/** Bill only the delta of an accumulating string — charging the total each pass would bill quadratically. */
	growString(total: number, delta: number): void {
		if (total > this.maxStringLength) {
			throw new ExpressionError(
				`Expression tried to build a string of ${total} characters (limit ${this.maxStringLength})`,
				"budget-exceeded",
			);
		}
		this.allocate(delta);
		this.tick(1 + (delta >> 10));
	}

	/** The array counterpart of {@link growString}. */
	growArray(total: number, delta: number): void {
		if (total > this.maxArrayLength) {
			throw new ExpressionError(
				`Expression tried to build an array of ${total} items (limit ${this.maxArrayLength})`,
				"budget-exceeded",
			);
		}
		this.allocate(delta);
		this.tick(1 + (delta >> 6));
	}

	/** Enter one callback invocation. Self-application is the one recursion the grammar cannot forbid, and it blows the native stack before steps react — the depth cap classifies it instead. */
	enter(): void {
		if (++this.depth > 64) {
			throw new ExpressionError(
				"Expression exceeded the callback depth limit (64)",
				"budget-exceeded",
			);
		}
	}

	/** Rewind to a fresh evaluation. Callers may reuse an instance across SYNC evaluations only. */
	reset(): void {
		this.steps = 0;
		this.depth = 0;
		this.allocated = 0;
		this.startedAt = 0;
		this.nextClockCheck = CLOCK_EVERY;
	}

	/** Guard an array an operation is about to produce. */
	array(length: number): void {
		if (length > this.maxArrayLength) {
			throw new ExpressionError(
				`Expression tried to build an array of ${length} items (limit ${this.maxArrayLength})`,
				"budget-exceeded",
			);
		}
		this.allocate(length);
		this.tick(1 + (length >> 6));
	}
}
