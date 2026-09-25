import { type ComponentEntry, EntryError, type ExpressionEvaluator } from "@uicast/core";
import { evaluate, parseSetAddress, planStepWaves } from "@uicast/core/internal";
import { useReducer, useRef } from "react";
import { requireScope } from "../guards";
import type { InitFn, Scopes } from "../types";

// One attempt per entry object; a re-emitted key replaces it.
type SeedAttempt = {
  element: ComponentEntry;
  error: unknown;
};

// What a failed seed's gate resolves to.
export type SeedFailure = { error: unknown };

type SeedResult = {
  // Never rejects: a failure resolves it with the error, and surfaces through `error` too.
  pending: Promise<SeedFailure | undefined> | null;
  // Rethrown inside the element's own boundary, so a bad seed cannot latch the parent.
  error: unknown;
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
  const pendingSeedRef = useRef<Promise<SeedFailure | undefined> | null>(null);

  const attempt = attemptRef.current;
  const shouldSeed =
    enabled &&
    !!element &&
    !!(element.seed || init) &&
    (attempt === null || (attempt.error !== null && attempt.element !== element));

  if (shouldSeed) {
    const record: SeedAttempt = { element, error: null };
    attemptRef.current = record;
    pendingSeedRef.current = null;

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
        const batch = chain.then(() => {
          // A `$$set` wake can land before this settles, so the gate is cleared explicitly.
          pendingSeedRef.current = null;
          forceRender();
        });
        // The gate must never reject: `use()` on a rejected promise does not reliably reach a boundary.
        pendingSeedRef.current = batch.then(
          () => undefined,
          (err) => {
            record.error = err;
            pendingSeedRef.current = null;
            forceRender();
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
  return {
    pending: pendingSeedRef.current,
    error: current && current.element === element ? current.error : null,
  };
}
