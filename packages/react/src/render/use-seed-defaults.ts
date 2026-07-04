import { useRef } from "react";
import { evaluate, parseScope, type ComponentEntry } from "@ui-fired/core";
import type { StandardToolV0Definition } from "standard-tool";
import { readScopePath } from "../read-scope-path";
import type { InitFn, Scopes } from "../types";

type SeededDefault = {
  kind: "default";
  targetScope: string;
  targetPath: string;
  value: unknown;
};
type SeededInit = { kind: "init"; value: Promise<unknown> };

// One-shot seeding of a node's `seed` and the host `init`, on its first real
// render. Sync writes land immediately; if any returns a Promise, the batch is
// parked on one Promise (returned for <Suspense>) so children wait for it.
// `hasBeenRenderedRef` pins the one-shot across streaming re-renders.
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
  functions?: StandardToolV0Definition[];
  allowedGlobals?: string[];
  enabled: boolean;
}): Promise<void> | null {
  const hasBeenRenderedRef = useRef(false);
  const setDefaultsPromiseRef = useRef<Promise<void> | null>(null);

  if (enabled && element && (element.seed || init) && !hasBeenRenderedRef.current) {
    const collected: Array<SeededDefault | SeededInit> = [];
    let hasAsync = false;

    element.seed?.forEach((setExpr) => {
      if (!setExpr.set) return;
      const [targetScope, targetPath] = parseScope(setExpr.set);
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
      }
    }
    hasBeenRenderedRef.current = true;
  }

  return setDefaultsPromiseRef.current;
}
