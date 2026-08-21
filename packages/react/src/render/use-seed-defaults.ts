import { useReducer, useRef } from "react";
import {
  EntryError,
  evaluate,
  parseScope,
  type ComponentEntry,
} from "uicast";
import type { StandardToolV0 } from "standard-tool";
import { readScopePath } from "../read-scope-path";
import type { InitFn, Scopes } from "../types";

type SeededDefault = {
  kind: "default";
  targetScope: string;
  targetPath: string;
  value: unknown;
};
type SeededInit = { kind: "init"; value: Promise<unknown> };

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
  allowedGlobals,
  enabled,
}: {
  element: ComponentEntry | undefined;
  scopes: Scopes;
  init?: InitFn;
  functions?: StandardToolV0[];
  allowedGlobals?: string[];
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
      const collected: Array<SeededDefault | SeededInit> = [];
      let hasAsync = false;

      element.seed?.forEach((setExpr) => {
        if (!setExpr.set) return;
        let targetScope: string;
        let targetPath: string;
        try {
          [targetScope, targetPath] = parseScope(setExpr.set);
        } catch (err) {
          // A seed `set:` path naming a nonexistent scope — document fault.
          throw EntryError.wrap(err, "unknown-reference", element.key);
        }
        const currentValue = readScopePath(scopes[targetScope], targetPath);
        const value = evaluate(
          setExpr,
          { scopes, currentValue },
          { functions, allowedGlobals },
        );
        if (value instanceof Promise) hasAsync = true;
        collected.push({ kind: "default", targetScope, targetPath, value });
      });

      if (init) {
        // `init` writes through the Proxy directly; sync writes have landed by the
        // time it returns, so we only track its Promise for the Suspense gate.
        // It's host code — failures classify as "host-init".
        try {
          const initResult = init({ scopes });
          if (initResult instanceof Promise) {
            hasAsync = true;
            collected.push({
              kind: "init",
              value: initResult.catch((err) => {
                throw EntryError.wrap(err, "host-init", element.key);
              }),
            });
          }
        } catch (err) {
          throw EntryError.wrap(err, "host-init", element.key);
        }
      }

      if (hasAsync) {
        const batch = Promise.all(
          collected.map(async (entry) => {
            if (entry.kind === "init") {
              await entry.value;
              return;
            }
            scopes[entry.targetScope].$set(entry.targetPath, await entry.value, {
              default: true,
            });
          }),
        ).then(() => {
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
      } else {
        for (const entry of collected) {
          if (entry.kind === "default") {
            scopes[entry.targetScope].$set(entry.targetPath, entry.value, {
              default: true,
            });
          }
        }
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
