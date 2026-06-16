import { useRef } from "react";
import { evaluate, parseScope, type ComponentEntry } from "@ui-fired/core";
import type { StandardTool } from "standard-tool";
import type { InitFn, Scopes } from "../types";

type SeededDefault = {
  kind: "default";
  targetScope: string;
  targetPath: string;
  value: unknown;
};
type SeededInit = { kind: "init"; value: Promise<unknown> };

/**
 * One-shot seeding of a node's `defaults` (LLM-authored) and the host `init`
 * callback, run during the node's first real render (`enabled` gates it to the
 * streamed, known-component path). Sync writes land immediately via the
 * reactive Proxy; if any default or `init` returns a Promise, the whole batch
 * is parked on a single Promise so children Suspend until every seed resolves.
 *
 * Returns that pending Promise (or `null` when seeding was sync / already done)
 * for the caller to hand to `<Suspense>`. The one-shot is pinned by
 * `hasBeenRenderedRef`, which survives streaming re-renders so new sibling
 * entries never re-fire it.
 */
export function useSeedDefaults({
  element,
  scopes,
  init,
  functions,
  enabled,
}: {
  element: ComponentEntry | undefined;
  scopes: Scopes;
  init?: InitFn;
  functions?: StandardTool[];
  enabled: boolean;
}): Promise<void> | null {
  const hasBeenRenderedRef = useRef(false);
  const setDefaultsPromiseRef = useRef<Promise<void> | null>(null);

  if (enabled && element && (element.defaults || init) && !hasBeenRenderedRef.current) {
    const collected: Array<SeededDefault | SeededInit> = [];
    let hasAsync = false;

    element.defaults?.forEach((setExpr) => {
      if (!setExpr.set) return;
      const value = evaluate(setExpr, { scopes }, { functions });
      const [targetScope, targetPath] = parseScope(setExpr.set);
      if (value instanceof Promise) hasAsync = true;
      collected.push({ kind: "default", targetScope, targetPath, value });
    });

    if (init) {
      // `init` writes through the reactive Proxy directly (`scopes.root.x = …`);
      // sync writes have already landed by the time it returns, so we only track
      // its Promise (if any) for the Suspense gate.
      const initResult = init({ scopes });
      if (initResult instanceof Promise) {
        hasAsync = true;
        collected.push({ kind: "init", value: initResult });
      }
    }

    if (hasAsync) {
      setDefaultsPromiseRef.current = Promise.all(
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
        // Clear on the next tick so the settled node leaves the Suspense path.
        setTimeout(() => {
          setDefaultsPromiseRef.current = null;
        }, 0);
      });
    } else {
      for (const entry of collected) {
        if (entry.kind === "default") {
          scopes[entry.targetScope].$set(entry.targetPath, entry.value, {
            default: true,
          });
        }
        // Sync `init` writes already landed via the Proxy `set` trap.
      }
    }
    hasBeenRenderedRef.current = true;
  }

  return setDefaultsPromiseRef.current;
}
