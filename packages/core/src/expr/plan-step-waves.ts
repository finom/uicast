import type { ExpressionEvaluator } from "@uicast/expr";
import { getScopeReads } from "./evaluate";

// Reads come back `scopes.`-prefixed; a `set` path may omit the prefix. Compared
// as written, a writer and its reader could land in one wave.
const asScopePath = (path: string): string => (path.startsWith("scopes.") ? path : `scopes.${path}`);

type PlannableStep = {
  set?: string;
  expr?: string;
  confirm?: string;
};

// Two dotted paths collide when either is a prefix of the other on a dot
// boundary — writing `a.b` invalidates a reader of `a.b.c` and vice versa.
const overlaps = (a: string, b: string): boolean =>
  a === b || a.startsWith(`${b}.`) || b.startsWith(`${a}.`);

// Partition steps into waves: reads wait for earlier writes, independent steps share a wave, `confirm` is a barrier.
// `isBarrier` adds barriers (host calls); `declaredWrites` adds unnamed written paths.
export function planStepWaves<T extends PlannableStep>(
  steps: readonly T[],
  evaluator: ExpressionEvaluator,
  isBarrier?: (step: T) => boolean,
  declaredWrites?: (step: T) => string[],
): T[][] {
  const waves: T[][] = [];
  let wave: T[] = [];
  let waveWrites: string[] = [];

  const close = () => {
    if (wave.length) waves.push(wave);
    wave = [];
    waveWrites = [];
  };

  for (const step of steps) {
    const reads = step.expr ? [...getScopeReads(step.expr, evaluator)] : [];
    // The dep extraction is text-based, so `currentValue` is matched the same way.
    if (step.expr && step.set && /\bcurrentValue\b/.test(step.expr)) {
      reads.push(asScopePath(step.set));
    }
    const dependsOnWave = reads.some((r) => waveWrites.some((w) => overlaps(r, w)));
    const barrier = !!step.confirm || !!isBarrier?.(step);
    if (dependsOnWave || barrier) close();
    wave.push(step);
    if (step.set) waveWrites.push(asScopePath(step.set));
    if (declaredWrites) waveWrites.push(...declaredWrites(step));
    if (barrier) close();
  }
  close();
  return waves;
}
