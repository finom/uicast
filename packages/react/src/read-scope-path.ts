// Read the value at a scope's dotted leaf path, walking the reactive Proxy the
// same way an expression's `scopes.<scope>.<path>` read would. A missing segment
// short-circuits to `undefined` instead of throwing — an unset path reads as
// `undefined`, matching how the same path reads inside an expression. Used to
// bind `currentValue` (the pre-write value at an assignment's `set` path) into
// seed and callback evaluation contexts.
export const readScopePath = (scope: unknown, leafPath: string): unknown =>
  leafPath
    .split(".")
    .reduce<unknown>(
      (acc, key) => (acc == null ? undefined : (acc as Record<string, unknown>)[key]),
      scope,
    );
