import { type BudgetOptions, DEFAULT_BUDGET, MAX_CALLBACK_DEPTH } from "../constants/limits";
import { ExpressionError } from "../errors";

// Every iterating built-in is implemented in this package, so each iteration ticks and each allocation is capped;
// straight-line work is charged per compiled node.

const now = Date.now;

// How often the wall clock is consulted — reading it every step costs more than the step.
const CLOCK_EVERY = 2_048;

const exceeded = (message: string): never => {
	throw new ExpressionError(message, "budget-exceeded");
};

// Every option filled in, once per evaluator; an explicit `undefined` still means the default.
export const resolveLimits = (options: BudgetOptions = {}): Required<BudgetOptions> => ({
	steps: options.steps ?? DEFAULT_BUDGET.steps,
	ms: options.ms ?? DEFAULT_BUDGET.ms,
	maxStringLength: options.maxStringLength ?? DEFAULT_BUDGET.maxStringLength,
	maxArrayLength: options.maxArrayLength ?? DEFAULT_BUDGET.maxArrayLength,
	maxTotalAllocation: options.maxTotalAllocation ?? DEFAULT_BUDGET.maxTotalAllocation,
});

// One per evaluation. Plain fields, not `#private`: the hottest object in the package, and it never leaves it.
export class Budget {
	steps = 0;
	// Live callback-invocation depth — see `enter`.
	depth = 0;
	// Characters plus array elements produced so far, across every operation.
	allocated = 0;
	// Started lazily on the first clock check — most evaluations never reach CLOCK_EVERY steps.
	private startedAt = 0;
	private nextClockCheck = CLOCK_EVERY;

	constructor(private readonly limits: Required<BudgetOptions>) {}

	tick(cost: number): void {
		this.steps += cost;
		if (this.steps >= this.limits.steps) exceeded(`Expression exceeded its step budget (${this.limits.steps} steps)`);
		if (this.steps >= this.nextClockCheck) {
			this.nextClockCheck = this.steps + CLOCK_EVERY;
			const t = now();
			if (this.startedAt === 0) this.startedAt = t;
			else if (t - this.startedAt > this.limits.ms) exceeded("Expression exceeded its time budget");
		}
	}

	// Guard a string an operation is about to produce.
	string(length: number): void {
		this.growString(length, length);
	}

	// Bill only the delta of an accumulating string — charging the total each pass would bill quadratically.
	growString(total: number, delta: number): void {
		if (total > this.limits.maxStringLength) {
			exceeded(`Expression tried to build a string of ${total} characters (limit ${this.limits.maxStringLength})`);
		}
		this.allocate(delta);
		this.tick(1 + (delta >> 10));
	}

	// Guard an array an operation is about to produce.
	array(length: number): void {
		this.growArray(length, length);
	}

	growArray(total: number, delta: number): void {
		if (total > this.limits.maxArrayLength) {
			exceeded(`Expression tried to build an array of ${total} items (limit ${this.limits.maxArrayLength})`);
		}
		this.allocate(delta);
		this.tick(1 + (delta >> 6));
	}

	enter(): void {
		if (++this.depth > MAX_CALLBACK_DEPTH) exceeded(`Expression exceeded the callback depth limit (${MAX_CALLBACK_DEPTH})`);
	}

	// Charge the running allocation total. A NaN or negative size (a coerced argument) charges nothing rather than poisoning the total.
	private allocate(units: number): void {
		if (!(units > 0)) return;
		this.allocated += units;
		if (this.allocated > this.limits.maxTotalAllocation) {
			exceeded(`Expression exceeded its total allocation budget (${this.limits.maxTotalAllocation} units)`);
		}
	}
}
