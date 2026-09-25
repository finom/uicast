import { EntryError, type ReactiveProxy } from "@uicast/core";
import type { Scopes } from "./types";

// A missing scope (a wrong `as`, usually) is the document's fault, so it is classified.
export const requireScope = (scopes: Scopes, name: string, elementKey: string): ReactiveProxy => {
  const scope = Object.hasOwn(scopes, name) ? scopes[name] : undefined;
  if (scope) return scope;
  throw new EntryError(
    `"scopes.${name}" does not exist — the scopes are "root" and, in a list's rows, "<as>" and "$<as>"`,
    {
      reason: "unknown-reference",
      elementKey,
    },
  );
};

// A host function in a reactive site would leak a Promise into render as a truthy object.
export const refusePromise = (value: unknown, slot: string, elementKey: string): void => {
  if (!(value instanceof Promise)) return;
  // Refused, so nothing awaits it: swallow its rejection.
  value.catch(() => {});
  throw new EntryError(
    `"${slot}" of ${elementKey} evaluated to a Promise — host functions and await are not allowed in props/hidden/loading/each; move the call to seed or a callback step`,
    { reason: "guardrail-violation", elementKey },
  );
};
