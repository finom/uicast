import { useReducer, useRef } from "react";
import { EntryError, type ComponentEntry, type ExpressionEvaluator } from "@uicast/core";
import { evaluate, planStepWaves } from "@uicast/core/internal";
import { readField, requireScope } from "../read-scope-path";
import { parseStepTargets } from "../step-targets";
import type { InitFn, Scopes } from "../types";

// One attempt per entry object — `element` identity changes when a re-emitted
// key replaces it (partial replacement).
type SeedAttempt = {
  element: ComponentEntry;
  failed: boolean;
  error: Error | null;
};

type SeedResult = {
  // Batch of in-flight async seed writes, for the <Suspense> gate. Never
  // rejects — failures surface through `error` instead.
  pending: Promise<void> | null;
  // A seed that threw (or rejected). The renderer rethrows it inside the
  // element's own error boundary, so a bad seed can't latch the parent.
  error: Error | null;
};

const toError = (err: unknown): Error =>
  err instanceof Error ? err : new Error(String(err));

// Sync seed and `init` writes land during render; a subscriber they wake must not set state until the render is over.
let seedRenders = 0;
export const inSeedRender = (): boolean => seedRenders > 0;

// One-shot seed + host `init` on first real render; async batches park on one
// Promise for <Suspense>. Attempts pin per entry object: success never
// re-runs, a failed seed retries when a corrected entry replaces it.
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
  // Wakes the component when an async seed settles — success clears the
  // Suspense gate, failure renders the error on the next pass.
  const [, forceRender] = useReducer((x: number): number => x + 1, 0);
  const attemptRef = useRef<SeedAttempt | null>(null);
  const pendingSeedRef = useRef<Promise<void> | null>(null);

  const attempt = attemptRef.current;
  const shouldSeed =
    enabled &&
    !!element &&
    !!(element.seed || init) &&
    (attempt === null || (attempt.failed && attempt.element !== element));

  if (shouldSeed && element) {
    const record: SeedAttempt = { element, failed: false, error: null };
    attemptRef.current = record;
    pendingSeedRef.current = null;

    seedRenders++;
    try {
      const steps = (element.seed ?? []).filter((step) => step.set);
      const targets = parseStepTargets(steps, element.key);

      // Run one wave (mutually independent steps) in parallel. Returns null
      // when fully synchronous, else a promise applying writes as it settles.
      const runWave = (wave: typeof steps): Promise<void> | null => {
        const evaluated = wave.map((step) => {
          const target = targets.get(step);
          if (!target) throw new Error(`Seed step of "${element.key}" has no parsed target.`);
          const currentValue = readField(scopes, target.scope, target.field);
          const value = evaluate(step, { scopes, currentValue }, evaluator);
          return { ...target, value };
        });
        if (evaluated.every((e) => !(e.value instanceof Promise))) {
          for (const e of evaluated) {
            requireScope(scopes, e.scope, element.key).$set(e.field, e.value, { default: true });
          }
          return null;
        }
        return Promise.all(
          evaluated.map(async (e) => {
            requireScope(scopes, e.scope, element.key).$set(e.field, await e.value, {
              default: true,
            });
          }),
        ).then(() => undefined);
      };

      const waves = planStepWaves(steps, evaluator);
      // Walk waves synchronously while they stay sync — their writes land
      // during this render, exactly like the old all-sync path — and switch to
      // a promise chain at the first async wave.
      let chain: Promise<void> | null = null;
      for (let i = 0; i < waves.length; i++) {
        const pendingWave = runWave(waves[i]);
        if (pendingWave) {
          const rest = waves.slice(i + 1);
          chain = pendingWave.then(async () => {
            for (const wave of rest) {
              await runWave(wave);
            }
          });
          break;
        }
      }

      if (init) {
        // `init` writes through the Proxy directly; sync writes have landed by the
        // time it returns, so we only track its Promise for the Suspense gate.
        // It's host code — failures classify as "host-init".
        try {
          const initResult = init({ scopes });
          if (initResult instanceof Promise) {
            const initPromise = initResult.catch((err) => {
              throw EntryError.wrap(err, "host-init", element.key);
            });
            chain = chain
              ? Promise.all([chain, initPromise]).then(() => undefined)
              : initPromise.then(() => undefined);
          }
        } catch (err) {
          throw EntryError.wrap(err, "host-init", element.key);
        }
      }

      if (chain) {
        const batch = chain.then(() => {
          // Clear the gate and wake the component — a `$set` wake can land
          // BEFORE this settles, so it cannot be relied on to see the cleared
          // gate.
          pendingSeedRef.current = null;
          forceRender();
        });
        // The Suspense gate must never reject — `use()` on a rejected promise
        // doesn't reliably reach an error boundary. Absorb the rejection into
        // the attempt record and wake the component to render the error.
        pendingSeedRef.current = batch.catch((err) => {
          record.failed = true;
          record.error = toError(err);
          pendingSeedRef.current = null;
          forceRender();
        });
      }
    } catch (err) {
      record.failed = true;
      record.error = toError(err);
      pendingSeedRef.current = null;
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
