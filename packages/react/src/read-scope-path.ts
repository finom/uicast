import { EntryError, type ReactiveProxy } from "@uicast/core";
import type { Scopes } from "./types";

// Read a dotted leaf path off a scope proxy the way an expression would;
// missing segments read as `undefined`. Binds `currentValue`.
export const readScopePath = (scope: unknown, leafPath: string): unknown =>
  leafPath
    .split(".")
    .reduce<unknown>(
      (acc, key) => (acc == null ? undefined : (acc as Record<string, unknown>)[key]),
      scope,
    );

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
