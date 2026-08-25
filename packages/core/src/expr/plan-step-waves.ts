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
 * Partition a step list (seed or callback) into dependency waves. Steps keep
 * their order semantically — a step that reads a path an earlier step writes
 * lands in a later wave, so it evaluates after that write — while steps with
 * no such dependency share a wave and may run in parallel. `currentValue`
 * counts as a read of the step's own `set` path. A `confirm` step is a
 * barrier: it sits alone in its wave, so everything before it has settled
 * when the dialog shows and nothing after it starts until it passes.
 *
 * `isBarrier` marks additional steps as barriers. The callback executor uses
 * it for steps that call host functions: a mutation's effect is invisible to
 * path analysis (deleteProduct() writes no scope path, but the refetch after
 * it depends on it all the same), so effectful steps must never race.
 */
export function planStepWaves<T extends PlannableStep>(
  steps: readonly T[],
  isBarrier?: (step: T) => boolean,
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
    if (barrier) close();
  }
  close();
  return waves;
}
