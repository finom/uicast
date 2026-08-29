import { useReducer, useRef } from "react";
import {
  EntryError,
  evaluate,
  parseScope,
  planStepWaves,
  type ComponentEntry,
} from "@uicast/core";
import type { StandardToolV0 } from "standard-tool";
import { readScopePath } from "../read-scope-path";
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

// One-shot seeding of a node's `seed` and the host `init`, on its first real
// render. Sync writes land immediately; if any returns a Promise, the batch is
// parked on one Promise (returned for <Suspense>) so children wait for it.
// Attempts are pinned per entry object: a successful seed never re-runs on a
// re-emitted key, while a failed one retries when a corrected entry replaces
// it (writes are `default: true`, so a retry can't clobber state that was set
// meanwhile).
export function useSeedDefaults({
  element,
  scopes,
  init,
  functions,
  allowGlobals,
  enabled,
}: {
  element: ComponentEntry | undefined;
  scopes: Scopes;
  init?: InitFn;
  functions?: StandardToolV0[];
  allowGlobals?: string[];
  enabled: boolean;
}): SeedResult {
  // Wakes the component when an async seed settles — success clears the
  // Suspense gate, failure renders the error on the next pass.
  const [, forceRender] = useReducer((x: number): number => x + 1, 0);
  const attemptRef = useRef<SeedAttempt | null>(null);
  const setDefaultsPromiseRef = useRef<Promise<void> | null>(null);

  const attempt = attemptRef.current;
  const shouldSeed =
    enabled &&
    !!element &&
    !!(element.seed || init) &&
    (attempt === null || (attempt.failed && attempt.element !== element));

  if (shouldSeed && element) {
    const record: SeedAttempt = { element, failed: false, error: null };
    attemptRef.current = record;
    setDefaultsPromiseRef.current = null;

    try {
      // Pre-validate every set path — a bad path is a document fault worth
      // failing on before any step runs.
      const steps = (element.seed ?? []).filter((step) => step.set);
      const targets = new Map<(typeof steps)[number], [string, string]>();
      for (const step of steps) {
        try {
          targets.set(step, parseScope(step.set));
        } catch (err) {
          throw EntryError.wrap(err, "unknown-reference", element.key);
        }
      }

      // Evaluate one wave: steps in a wave are mutually independent, so they
      // run in parallel; a step that reads an earlier step's write sits in a
      // later wave (see planStepWaves) and evaluates after that write landed.
      // Returns null when every step resolved synchronously (writes applied),
      // else a promise that applies the wave's writes as it settles.
      const runWave = (wave: typeof steps): Promise<void> | null => {
        const evaluated = wave.map((step) => {
          const [targetScope, targetPath] = targets.get(step)!;
          const currentValue = readScopePath(scopes[targetScope], targetPath);
          const value = evaluate(
            step,
            { scopes, currentValue },
            { functions, allowGlobals },
          );
          return { targetScope, targetPath, value };
        });
        if (evaluated.every((e) => !(e.value instanceof Promise))) {
          for (const e of evaluated) {
            scopes[e.targetScope].$set(e.targetPath, e.value, { default: true });
          }
          return null;
        }
        return Promise.all(
          evaluated.map(async (e) => {
            scopes[e.targetScope].$set(e.targetPath, await e.value, {
              default: true,
            });
          }),
        ).then(() => undefined);
      };

      let hasAsync = false;
      const waves = planStepWaves(steps);
      // Walk waves synchronously while they stay sync — their writes land
      // during this render, exactly like the old all-sync path — and switch to
      // a promise chain at the first async wave.
      let chain: Promise<void> | null = null;
      for (let i = 0; i < waves.length; i++) {
        const pendingWave = runWave(waves[i]);
        if (pendingWave) {
          hasAsync = true;
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
            hasAsync = true;
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

      if (hasAsync && chain) {
        const batch = chain.then(() => {
          // Clear the gate and wake the component so the next pass renders
          // without Suspense and the boundary's reset token flips back to the
          // entry — clearing a latch from a fallback that threw against
          // pre-seed state. (A `$set` wake can land BEFORE this settles, so it
          // can't be relied on to observe the cleared gate.)
          setDefaultsPromiseRef.current = null;
          forceRender();
        });
        // The Suspense gate must never reject — `use()` on a rejected promise
        // doesn't reliably reach an error boundary. Absorb the rejection into
        // the attempt record and wake the component to render the error.
        setDefaultsPromiseRef.current = batch.catch((err) => {
          record.failed = true;
          record.error = toError(err);
          setDefaultsPromiseRef.current = null;
          forceRender();
        });
      }
    } catch (err) {
      record.failed = true;
      record.error = toError(err);
      setDefaultsPromiseRef.current = null;
    }
  }

  const current = attemptRef.current;
  return {
    pending: setDefaultsPromiseRef.current,
    error: current && current.element === element ? current.error : null,
  };
}
