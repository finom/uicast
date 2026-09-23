import { describe, expect, it } from "vitest";
import { ALLOWED_METHOD_NAMES } from "../constants/methods";
import { compileAst } from "../interpret/compile";
import { Budget, resolveLimits } from "../runtime/budget";
import { Analyzer } from "../syntax/analyzer";
import { CONTEXT, PLAIN, WORKLOADS } from "./price-workloads";

// Each operation's time per charged step, over a plain step's. Far above 1, the operation is underpriced:
// a long evaluation of it would reach the clock before the step limit, and only on slow devices.
const MAX_RATIO = 4;
const RUNS = 5;

const UNLIMITED = Number.MAX_SAFE_INTEGER;
const LIMITS = resolveLimits({
	steps: UNLIMITED,
	ms: UNLIMITED,
	maxStringLength: UNLIMITED,
	maxArrayLength: UNLIMITED,
	maxTotalAllocation: UNLIMITED,
});
const analyzer = new Analyzer({ tools: {}, maxSourceLength: 10_000, maxCacheSize: 1_000 });
const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];

const nsPerStep = (source: string): number => {
	const run = compileAst(analyzer.analyze(source).ast, {});
	const once = () => {
		const budget = new Budget(LIMITS);
		const start = performance.now();
		run(null, { budget, contexts: [CONTEXT] });
		return ((performance.now() - start) * 1e6) / budget.steps;
	};
	once();
	once();
	return median(Array.from({ length: RUNS }, once));
};

describe("step prices", () => {
	it("give every method a workload", () => {
		const measured = (name: string) => WORKLOADS.some(([, source]) => source.includes(`.${name}(`));
		expect([...ALLOWED_METHOD_NAMES].filter((name) => !measured(name))).toEqual([]);
	});

	it(`keep every operation within ${MAX_RATIO}× a plain step's time`, () => {
		const plain = median(PLAIN.map(nsPerStep));
		const over = WORKLOADS.map(([name, source]) => ({ name, ratio: nsPerStep(source) / plain })).filter(
			({ ratio }) => ratio > MAX_RATIO,
		);
		expect(over).toEqual([]);
	}, 60_000);
});
