import { getScopeReads } from "./evaluate";

type PlannableStep = {
  set?: string;
  expr?: string;
  confirm?: string;
};

// Two dotted paths collide when either is a prefix of the other on a dot
// boundary — writing `a.b` invalidates a reader of `a.b.c` and vice versa.
const overlaps = (a: string, b: string): boolean =>
  a === b || a.startsWith(`${b}.`) || b.startsWith(`${a}.`);

/**
 * Partition a step list (seed or callback) into dependency waves: a step
 * reading a path an earlier step writes lands in a later wave; independent
 * steps share one and may run in parallel. `currentValue` counts as a read of
 * the step's own `set` path. A `confirm` step is a barrier, alone in its wave.
 *
 * `isBarrier` marks more barriers — the callback runner uses it for
 * host-function calls, whose effects path analysis can't see. `declaredWrites`
 * adds written paths a step's `set` doesn't name — the react binding declares
 * a row write's source-array/childScopes aliases through it.
 */
export function planStepWaves<T extends PlannableStep>(
  steps: readonly T[],
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
    const reads = step.expr ? [...getScopeReads(step.expr)] : [];
    // The dep extraction is text-based, so `currentValue` is matched the same way.
    if (step.expr && step.set && /\bcurrentValue\b/.test(step.expr)) {
      reads.push(step.set);
    }
    const dependsOnWave = reads.some((r) => waveWrites.some((w) => overlaps(r, w)));
    const barrier = !!step.confirm || !!isBarrier?.(step);
    if (dependsOnWave || barrier) close();
    wave.push(step);
    if (step.set) waveWrites.push(step.set);
    if (declaredWrites) waveWrites.push(...declaredWrites(step));
    if (barrier) close();
  }
  close();
  return waves;
}
