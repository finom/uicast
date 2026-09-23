import { EntryError, type ReactiveProxy } from "@uicast/core";
import type { Scopes } from "./types";

// A missing scope (a wrong `as`, usually) is the document's fault, so it is classified.
export const requireScope = (scopes: Scopes, name: string, elementKey: string): ReactiveProxy => {
  const scope = Object.hasOwn(scopes, name) ? scopes[name] : undefined;
  if (!scope) {
    throw new EntryError(
      `"scopes.${name}" does not exist — the scopes are "root" and each list's "as" name`,
      { reason: "unknown-reference", elementKey },
    );
  }
  return scope;
};
