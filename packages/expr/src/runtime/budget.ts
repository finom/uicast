import { ARRAY_ALLOCATION_SHIFT, type BudgetOptions, DEFAULT_BUDGET, STRING_ALLOCATION_SHIFT } from "../constants/limits";
import { ExpressionError } from "../errors";

// How often the wall clock is consulted — reading it every step costs more than the step.
const CLOCK_EVERY = 2_048;

const exceeded = (message: string): never => {
	throw new ExpressionError(message, "budget-exceeded");
};

// An explicit `undefined` still means the default.
export const resolveLimits = (options: BudgetOptions = {}): Required<BudgetOptions> => ({
	steps: options.steps ?? DEFAULT_BUDGET.steps,
	ms: options.ms ?? DEFAULT_BUDGET.ms,
	maxStringLength: options.maxStringLength ?? DEFAULT_BUDGET.maxStringLength,
	maxArrayLength: options.maxArrayLength ?? DEFAULT_BUDGET.maxArrayLength,
	maxTotalAllocation: options.maxTotalAllocation ?? DEFAULT_BUDGET.maxTotalAllocation,
});

// Plain fields, not `#private`: the hottest object in the package.
export class Budget {
	steps = 0;
	// Characters plus array elements produced so far, across every operation.
	allocated = 0;
	// Started lazily on the first clock check — most evaluations never reach CLOCK_EVERY steps.
	private startedAt = 0;
	private nextClockCheck = CLOCK_EVERY;
	private nextCheck: number;
	private charged: Set<string> | null = null;

	constructor(private readonly limits: Required<BudgetOptions>) {
		this.nextCheck = Math.min(CLOCK_EVERY, limits.steps);
	}

	// One comparison on the hot path; the limit and the clock are told apart only when it trips.
	tick(cost: number): void {
		this.steps += cost;
		if (this.steps >= this.nextCheck) this.check();
	}

	private check(): void {
		if (this.steps >= this.limits.steps) exceeded(`Expression exceeded its step budget (${this.limits.steps} steps)`);
		if (this.steps >= this.nextClockCheck) {
			this.nextClockCheck = this.steps + CLOCK_EVERY;
			const t = Date.now();
			if (this.startedAt === 0) this.startedAt = t;
			else if (t - this.startedAt > this.limits.ms) exceeded("Expression exceeded its time budget");
		}
		this.nextCheck = Math.min(this.nextClockCheck, this.limits.steps);
	}

	// Charges `cost` the first time `key` comes up in this evaluation.
	once(key: string, cost: number): void {
		this.charged ??= new Set();
		if (this.charged.has(key)) return;
		this.charged.add(key);
		this.tick(cost);
	}

	string(length: number): void {
		this.growString(length, length);
	}

	// Bill only the delta of an accumulating string — charging the total each pass would bill quadratically.
	growString(total: number, delta: number): void {
		if (total > this.limits.maxStringLength) {
			exceeded(`Expression tried to build a string of ${total} characters (limit ${this.limits.maxStringLength})`);
		}
		this.allocate(delta);
		this.tick(1 + (delta >> STRING_ALLOCATION_SHIFT));
	}

	array(length: number): void {
		this.growArray(length, length);
	}

	growArray(total: number, delta: number): void {
		if (total > this.limits.maxArrayLength) {
			exceeded(`Expression tried to build an array of ${total} items (limit ${this.limits.maxArrayLength})`);
		}
		this.allocate(delta);
		this.tick(1 + (delta >> ARRAY_ALLOCATION_SHIFT));
	}

	// A NaN or negative size (a coerced argument) charges nothing rather than poisoning the total.
	private allocate(units: number): void {
		if (!(units > 0)) return;
		this.allocated += units;
		if (this.allocated > this.limits.maxTotalAllocation) {
			exceeded(`Expression exceeded its total allocation budget (${this.limits.maxTotalAllocation} units)`);
		}
	}
}
