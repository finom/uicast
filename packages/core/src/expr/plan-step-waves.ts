import type { ExpressionEvaluator } from "@uicast/expr";
import { depKey } from "../scope/parse-scope";
import { getScopeReads } from "./evaluate";

type PlannableStep = {
  set?: string;
  expr?: string;
  confirm?: string;
};

// Partition steps into waves: reads wait for earlier writes, independent steps share a wave, `confirm` is a barrier.
// `isBarrier` adds barriers (host calls); `declaredWrites` adds unnamed written keys.
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
      for (const r of getScopeReads(step.expr, evaluator)) {
        const key = depKey(r);
        if (key) reads.push(key);
      }
      // The dep extraction is text-based, so `currentValue` is matched the same way.
      if (step.set && /\bcurrentValue\b/.test(step.expr)) reads.push(step.set);
    }
    const dependsOnWave = reads.some((r) => waveWrites.has(r));
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
