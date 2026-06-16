import { useEffect, useReducer } from "react";
import { extractDeps, parseScope, type ComponentEntry } from "@ui-fired/core";
import type { Scopes } from "../types";

/**
 * Subscribe the calling node to every reactive path its entry reads, forcing a
 * re-render when any of them changes. The dep set is auto-derived from the
 * entry's own expression text — `extractDeps` static-walks each `props.expr` /
 * `hidden` for `scopes.X.Y` reads. Owns the node's `forceRender`.
 *
 * `skip` short-circuits the subscription without breaking the rules of hooks —
 * used for the list-container pass, where `ListEntryRenderer` owns the list's deps.
 */
export function useReactiveDeps(
  element: ComponentEntry | undefined,
  scopes: Scopes,
  skip = false,
): void {
  const [, forceRender] = useReducer((x: number): number => x + 1, 0);
  useEffect(() => {
    if (!element || skip) return;
    const deps = extractDeps(element);
    if (deps.length === 0) return;

    const unsubscribers: (() => void)[] = [];
    for (const dep of deps) {
      const [targetScope, targetPath] = parseScope(dep);
      // An item-scoped entry can render before its item proxy is wired into the
      // scopes map (first paint of a fresh list) — skip the missing scope; the
      // next render after mount catches up.
      const unsubscribe = scopes[targetScope]?.$emitter.on(targetPath, forceRender);
      if (unsubscribe) unsubscribers.push(unsubscribe);
    }
    return () => unsubscribers.forEach((unsub) => unsub());
  }, [element, scopes, skip]);
}
