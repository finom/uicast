import { type ComponentEntry, EntryError, type ExpressionEvaluator } from "@uicast/core";
import { evaluate, parseSetAddress, planStepWaves } from "@uicast/core/internal";
import { useEffect, useReducer, useRef } from "react";
import { requireScope } from "../guards";
import type { InitFn, Scopes } from "../types";

// One attempt per entry object; a re-emitted key replaces it.
type SeedAttempt = {
  element: ComponentEntry;
  error: unknown;
  // What `SuspendUntil` waits on; null when the seed was synchronous or has settled.
  pending: Promise<SeedFailure | undefined> | null;
  // Set once a render using the attempt commits; waking a render React threw away warns.
  wake: (() => void) | null;
};

// What a failed seed's gate resolves to.
export type SeedFailure = { error: unknown };

type SeedResult = {
  // Never rejects: a failure resolves it with the error, and surfaces through `error` too.
  pending: Promise<SeedFailure | undefined> | null;
  // Rethrown inside the element's own boundary, so a bad seed cannot latch the parent.
  error: unknown;
};

// React can throw a render away before it mounts; the next render of the same entry and scopes adopts its seed.
const attempts = new WeakMap<Scopes, WeakMap<ComponentEntry, SeedAttempt>>();

// A `$$set` wake can land before this, so the gate is cleared explicitly.
const settle = (attempt: SeedAttempt): void => {
  attempt.pending = null;
  attempt.wake?.();
};

// Sync seed and `init` writes land during render; a subscriber they wake must not set state until the render is over.
let seedRenders = 0;
export const inSeedRender = (): boolean => seedRenders > 0;

// Success never re-runs; a failed seed retries when a corrected entry replaces it.
export function useSeed({
  element,
  scopes,
  init,
  evaluator,
  enabled,
}: {
  element: ComponentEntry | undefined;
  scopes: Scopes;
  init?: InitFn;
  evaluator: ExpressionEvaluator;
  enabled: boolean;
}): SeedResult {
  const [, forceRender] = useReducer((x: number): number => x + 1, 0);
  const attemptRef = useRef<SeedAttempt | null>(null);
  if (!attemptRef.current && element) {
    const earlier = attempts.get(scopes)?.get(element);
    // A failed attempt is left behind, so a fresh mount retries it.
    if (earlier && earlier.error === null) attemptRef.current = earlier;
  }

  const attempt = attemptRef.current;
  const shouldSeed =
    enabled &&
    !!element &&
    !!(element.seed || init) &&
    (attempt === null || (attempt.error !== null && attempt.element !== element));

  if (shouldSeed) {
    const record: SeedAttempt = { element, error: null, pending: null, wake: null };
    attemptRef.current = record;
    const byEntry = attempts.get(scopes) ?? new WeakMap<ComponentEntry, SeedAttempt>();
    attempts.set(scopes, byEntry.set(element, record));

    seedRenders++;
    try {
      // A bad address fails classified before any step runs.
      const steps = (element.seed ?? []).map((step) => ({ ...step, ...parseSetAddress(step.set, element.key) }));

      // Null when fully synchronous.
      const runWave = (wave: typeof steps): Promise<unknown> | null => {
        const evaluated = wave.map((step) => {
          const scope = requireScope(scopes, step.scope, element.key);
          const value = evaluate(step, { scopes, currentValue: scope[step.field] }, evaluator);
          return { scope, field: step.field, value };
        });
        if (evaluated.every((e) => !(e.value instanceof Promise))) {
          for (const e of evaluated) e.scope.$$set(e.field, e.value, { default: true });
          return null;
        }
        return Promise.all(
          evaluated.map(async (e) => {
            e.scope.$$set(e.field, await e.value, { default: true });
          }),
        );
      };

      // Sync waves land during this render; from the first async wave on, each waits for the one before.
      let chain: Promise<unknown> | null = null;
      for (const wave of planStepWaves(steps, evaluator)) {
        chain = chain ? chain.then(() => runWave(wave)) : runWave(wave);
      }

      if (init) {
        // `init` writes through the proxy directly; only its Promise matters for the Suspense gate.
        try {
          const initResult = init({ scopes });
          if (initResult instanceof Promise) {
            const initPromise = initResult.catch((err) => {
              throw EntryError.wrap(err, "host-init", element.key);
            });
            chain = chain ? Promise.all([chain, initPromise]) : initPromise;
          }
        } catch (err) {
          throw EntryError.wrap(err, "host-init", element.key);
        }
      }

      if (chain) {
        // The gate must never reject: `use()` on a rejected promise does not reliably reach a boundary.
        record.pending = chain.then(
          () => {
            settle(record);
            return undefined;
          },
          (err) => {
            record.error = err;
            settle(record);
            return { error: err };
          },
        );
      }
    } catch (err) {
      record.error = err;
    } finally {
      seedRenders--;
    }
  }

  const current = attemptRef.current;
  const pending = current?.pending ?? null;
  useEffect(() => {
    if (!current) return;
    current.wake = forceRender;
    // It settled before this render committed, so nothing woke it.
    if (pending && !current.pending) forceRender();
  }, [current, pending]);

  return {
    pending,
    error: current && current.element === element ? current.error : null,
  };
}
