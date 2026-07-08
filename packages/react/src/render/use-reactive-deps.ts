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
    let deps: string[];
    try {
      deps = extractDeps(element);
    } catch {
      // An unparseable expression throws at dep extraction too, but an effect
      // throw would latch the PARENT's boundary. The same expression throws
      // where it's evaluated — inside this element's own boundary — so keep
      // the blast radius there and subscribe to nothing.
      return;
    }
    if (deps.length === 0) return;

    const unsubscribers: (() => void)[] = [];
    for (const dep of deps) {
      let targetScope: string;
      let targetPath: string;
      try {
        [targetScope, targetPath] = parseScope(dep);
      } catch {
        // A bare whole-scope read (`scopes.root` with no path) is a valid
        // expression but not a subscribable path — skip it; throwing here
        // would latch the PARENT's boundary, same as the extractDeps case.
        continue;
      }
      // An item-scoped entry can render before its proxy is in the scopes map
      // (first paint of a fresh list) — skip it; the next render catches up.
      const unsubscribe = scopes[targetScope]?.$emitter.on(targetPath, forceRender);
      if (unsubscribe) unsubscribers.push(unsubscribe);
    }
    return () => {
      for (const unsub of unsubscribers) unsub();
    };
  }, [element, scopes, skip]);
}
