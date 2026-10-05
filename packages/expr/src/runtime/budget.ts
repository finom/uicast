import { type BudgetOptions, CHARS_PER_STEP, DEFAULT_BUDGET } from "../constants/limits";
import { ExpressionError } from "../errors";

// How often the wall clock is consulted — reading it every step costs more than the step.
const CLOCK_EVERY = 2_048;

export const exceeded = (message: string): never => {
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
      this.clock();
    }
    this.nextCheck = Math.min(this.nextClockCheck, this.limits.steps);
  }

  // Also called right after a slow built-in, such as building a formatter, which steps barely count.
  clock(): void {
    const t = Date.now();
    if (this.startedAt === 0) this.startedAt = t;
    else if (t - this.startedAt > this.limits.ms) exceeded("Expression exceeded its time budget");
  }

  // Characters a built-in reads or writes. A NaN or negative length (a coerced argument) charges nothing.
  text(length: number): void {
    if (length > 0) this.tick(Math.ceil(length / CHARS_PER_STEP));
  }

  // Refuses a call's result before it is built, without counting it: the membrane counts the result.
  checkString(length: number): void {
    this.capString(length);
    this.capTotal(length);
  }

  checkArray(length: number): void {
    this.capArray(length);
    this.capTotal(length);
  }

  string(length: number): void {
    this.growString(length, length);
  }

  // Bill only the delta of an accumulating string — charging the total each pass would bill quadratically.
  growString(total: number, delta: number): void {
    this.capString(total);
    this.allocate(delta);
    this.tick(1);
    this.text(delta);
  }

  array(length: number): void {
    this.growArray(length, length);
  }

  growArray(total: number, delta: number): void {
    this.capArray(total);
    this.allocate(delta);
    this.tick(delta > 0 ? 1 + delta : 1);
  }

  private capString(length: number): void {
    if (length > this.limits.maxStringLength) {
      exceeded(`Expression tried to build a string of ${length} characters (limit ${this.limits.maxStringLength})`);
    }
  }

  private capArray(length: number): void {
    if (length > this.limits.maxArrayLength) {
      exceeded(`Expression tried to build an array of ${length} items (limit ${this.limits.maxArrayLength})`);
    }
  }

  private capTotal(units: number): void {
    if (this.allocated + units > this.limits.maxTotalAllocation) {
      exceeded(`Expression exceeded its total allocation budget (${this.limits.maxTotalAllocation} units)`);
    }
  }

  // A NaN or negative size (a coerced argument) charges nothing rather than poisoning the total.
  private allocate(units: number): void {
    if (!(units > 0)) return;
    this.capTotal(units);
    this.allocated += units;
  }
}
