import { useEffect, useReducer, useRef } from "react";
import type { ComponentEntry } from "@uicast/core";
import {
  extractDeps,
  parseScope,
  type DepsPart,
} from "@uicast/core/internal";
import { useRendererRegistry } from "../store/renderer-registry";
import type { Scopes } from "../types";
import { inSeedRender } from "./use-seed";

// Subscribing lands one commit late; comparing this count across the gap catches a write the node could not hear.
function emitCount(scopes: Scopes): number {
  let total = 0;
  for (const key in scopes) total += scopes[key].$$emitter.version;
  return total;
}

// `mode` picks the slice, so a list and its items don't double-subscribe.
export function useReactiveDeps(
  element: ComponentEntry | undefined,
  scopes: Scopes,
  mode: DepsPart,
): void {
  const [, forceRender] = useReducer((x: number): number => x + 1, 0);
  const { evaluator } = useRendererRegistry();

  // Written during render on purpose: the count as of the render whose output is on screen.
  const countAtRender = useRef(0);
  countAtRender.current = emitCount(scopes);

  useEffect(() => {
    if (!element) return;
    let deps: string[];
    try {
      deps = extractDeps(element, evaluator, mode);
    } catch {
      // An effect throw would latch the PARENT's boundary; the same expression throws where it is evaluated.
      return;
    }
    if (deps.length === 0) return;

    // A write from another element's seed lands mid-render; wake after it.
    const wake = () => (inSeedRender() ? queueMicrotask(forceRender) : forceRender());
    const unsubscribers: (() => void)[] = [];
    for (const dep of deps) {
      const [targetScope, field] = parseScope(dep);
      // A scope that does not exist (a wrong `as`, usually) has nothing to subscribe to.
      if (Object.hasOwn(scopes, targetScope)) unsubscribers.push(scopes[targetScope].$$emitter.on(field, wake));
    }

    // Catches a write between the render above and this line; settles in one extra pass.
    if (emitCount(scopes) !== countAtRender.current) forceRender();

    return () => {
      for (const unsub of unsubscribers) unsub();
    };
  }, [element, scopes, mode, evaluator]);
}
