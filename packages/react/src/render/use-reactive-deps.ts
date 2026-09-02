import { useEffect, useReducer, useRef } from "react";
import type { ComponentEntry } from "@uicast/core";
import {
  extractDeps,
  parseScope,
  type DepsPart,
} from "@uicast/core/internal";
import { useRendererRegistry } from "../store/renderer-registry";
import type { Scopes } from "../types";

// Total emits across readable scopes. Subscribing lands one commit late, so
// comparing this count across the gap is how a node notices a write it could
// not hear. Integer compare per render.
function emitCount(scopes: Scopes): number {
  let total = 0;
  for (const key in scopes) total += scopes[key]?.$emitter.version ?? 0;
  return total;
}

// Subscribe the node to every `scopes.<scope>.<field>` its entry reads. `mode` picks the slice
// (see DepsPart) so container and items don't double-subscribe; `"skip"`
// leaves a list's deps to ListEntryRenderer.
export function useReactiveDeps(
  element: ComponentEntry | undefined,
  scopes: Scopes,
  mode: DepsPart | "skip" = "all",
): void {
  const [, forceRender] = useReducer((x: number): number => x + 1, 0);
  const { evaluator } = useRendererRegistry();

  // Written during render, on purpose: it has to be the count as of the render
  // whose output is on screen, which is the thing the effect below compares to.
  const countAtRender = useRef(0);
  countAtRender.current = emitCount(scopes);

  useEffect(() => {
    if (!element || mode === "skip") return;
    let deps: string[];
    try {
      deps = extractDeps(element, evaluator, mode);
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
      const [targetScope, field] = parseScope(dep);
      // An item-scoped entry can render before its proxy is in the scopes map
      // (first paint of a fresh list) — skip it; the next render catches up.
      const unsubscribe = scopes[targetScope]?.$emitter.on(field, forceRender);
      if (unsubscribe) unsubscribers.push(unsubscribe);
    }

    // Catch up on anything written between the render above and this line. The
    // re-render re-reads the scopes and refreshes `countAtRender`, and this
    // effect does not re-run for it, so it settles in one extra pass.
    if (emitCount(scopes) !== countAtRender.current) forceRender();

    return () => {
      for (const unsub of unsubscribers) unsub();
    };
  }, [element, scopes, mode, evaluator]);
}
