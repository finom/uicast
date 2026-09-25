// A row window compares through its traps.
export const structurallyEqual = (a: unknown, b: unknown): boolean => {
  if (Object.is(a, b)) return true;
  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a)) {
    return a.length === (b as unknown[]).length && a.every((v, i) => structurallyEqual(v, (b as unknown[])[i]));
  }
  const keys = Object.keys(a);
  if (keys.length !== Object.keys(b).length) return false;
  return keys.every(
    (k) =>
      Object.hasOwn(b, k) && structurallyEqual((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]),
  );
};
