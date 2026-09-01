// Read a dotted leaf path off a scope proxy the way an expression would;
// missing segments read as `undefined`. Binds `currentValue`.
export const readScopePath = (scope: unknown, leafPath: string): unknown =>
  leafPath
    .split(".")
    .reduce<unknown>(
      (acc, key) => (acc == null ? undefined : (acc as Record<string, unknown>)[key]),
      scope,
    );
