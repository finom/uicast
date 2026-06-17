import { useEffect, useReducer } from "react";
import { extractDeps, parseScope, type ComponentEntry } from "@ui-fired/core";
import type { Scopes } from "../types";

// Subscribe the node to every reactive path its entry reads (auto-derived from
// the expression text), re-rendering when any changes. `skip` lets the
// list-container pass leave the list's deps to ListEntryRenderer.
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
      // An item-scoped entry can render before its proxy is in the scopes map
      // (first paint of a fresh list) — skip it; the next render catches up.
      const unsubscribe = scopes[targetScope]?.$emitter.on(targetPath, forceRender);
      if (unsubscribe) unsubscribers.push(unsubscribe);
    }
    return () => unsubscribers.forEach((unsub) => unsub());
  }, [element, scopes, skip]);
}
