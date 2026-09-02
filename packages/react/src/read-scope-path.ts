import { EntryError, type ReactiveProxy } from "@uicast/core";
import type { Scopes } from "./types";

// The scope a step writes to. Naming one that does not exist — a wrong `as`, usually — is the document's mistake, so it is classified rather than a raw TypeError.
export const requireScope = (scopes: Scopes, name: string, elementKey?: string): ReactiveProxy => {
  const scope = scopes[name];
  if (!scope) {
    throw new EntryError(
      `"scopes.${name}" does not exist — the scopes are "root" and each list's "as" name`,
      { reason: "unknown-reference", elementKey },
    );
  }
  return scope;
};

// `currentValue` for a step: the field as it is now, or `undefined` when the scope is missing (the write then fails classified).
export const readField = (scopes: Scopes, scope: string, field: string): unknown =>
  (scopes[scope] as Record<string, unknown> | undefined)?.[field];
