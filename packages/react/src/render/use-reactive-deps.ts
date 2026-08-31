import { useEffect, useReducer, useRef } from "react";
import type { ComponentEntry } from "@uicast/core";
import {
  extractDeps,
  parseScope,
  type DepsPart,
} from "@uicast/core/internal";
import type { Scopes } from "../types";

// Total emits across every scope this node can read. Subscribing happens in an
// effect, one commit after the value was computed, so a write landing in
// between (a sibling's effect — a list publishing `childScopes.<as>`, say)
// fires before the handler exists. Comparing this count across that gap is how
// the node notices it missed one; the paths themselves are not read, so it
// stays an integer compare per render.
function emitCount(scopes: Scopes): number {
  let total = 0;
  for (const key in scopes) total += scopes[key]?.$emitter.version ?? 0;
  return total;
}

// Subscribe the node to every reactive path its entry reads (auto-derived from
// the expression text), re-rendering when any changes. `mode` picks the slice
// (see DepsPart): the list container subscribes to `each` only, each item to
// props + hidden only — subscribing both to everything would double-render
// every row. `"skip"` lets the container pass leave the list's deps to
// ListEntryRenderer entirely.
export function useReactiveDeps(
  element: ComponentEntry | undefined,
  scopes: Scopes,
  mode: DepsPart | "skip" = "all",
): void {
  const [, forceRender] = useReducer((x: number): number => x + 1, 0);

  // Written during render, on purpose: it has to be the count as of the render
  // whose output is on screen, which is the thing the effect below compares to.
  const countAtRender = useRef(0);
  countAtRender.current = emitCount(scopes);

  useEffect(() => {
    if (!element || mode === "skip") return;
    let deps: string[];
    try {
      deps = extractDeps(element, mode);
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

    // Catch up on anything written between the render above and this line. The
    // re-render re-reads the scopes and refreshes `countAtRender`, and this
    // effect does not re-run for it, so it settles in one extra pass.
    if (emitCount(scopes) !== countAtRender.current) forceRender();

    return () => {
      for (const unsub of unsubscribers) unsub();
    };
  }, [element, scopes, mode]);
}
