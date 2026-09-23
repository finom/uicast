import type { ExpressionEvaluator } from "@uicast/expr";
import { depKey } from "../scope/parse-scope";
import { wrapEvalError } from "./evaluate";

type PlannableStep = {
  set?: string;
  expr?: string;
  confirm?: string;
};

// Reads wait for earlier writes, independent steps share a wave, `confirm` and `isBarrier` steps are barriers.
export function planStepWaves<T extends PlannableStep>(
  steps: readonly T[],
  evaluator: ExpressionEvaluator,
  isBarrier?: (step: T) => boolean,
  declaredWrites?: (step: T) => string[],
): T[][] {
  const waves: T[][] = [];
  let wave: T[] = [];
  let waveWrites = new Set<string>();

  const close = () => {
    if (wave.length) waves.push(wave);
    wave = [];
    waveWrites = new Set();
  };

  for (const step of steps) {
    const reads: string[] = [];
    if (step.expr) {
      // Planning parses before `evaluate` runs, so a bad expression must be classified here.
      try {
        for (const r of evaluator.memberReads(step.expr, "scopes")) reads.push(depKey(r));
        // `currentValue` is the value at the step's own `set`.
        if (step.set && evaluator.validate(step.expr).freeIds.includes("currentValue")) reads.push(step.set);
      } catch (err) {
        throw wrapEvalError(err);
      }
    }
    // A whole-scope read (`scopes.root.*`) waits for any write into that scope.
    const dependsOnWave = reads.some((r) =>
      r.endsWith(".*") ? [...waveWrites].some((w) => w.startsWith(r.slice(0, -1))) : waveWrites.has(r),
    );
    const barrier = !!step.confirm || !!isBarrier?.(step);
    if (dependsOnWave || barrier) close();
    wave.push(step);
    if (step.set) waveWrites.add(step.set);
    if (declaredWrites) for (const w of declaredWrites(step)) waveWrites.add(w);
    if (barrier) close();
  }
  close();
  return waves;
}
