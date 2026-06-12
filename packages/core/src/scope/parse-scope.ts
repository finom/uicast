/**
 * Split a scope key into `[scopeName, leafPath]`.
 *
 * Strips the leading namespace token (default `"scopes"`) if present, then
 * splits on the first dot: the head is the named scope, the tail is the path
 * *within* that scope.
 *
 *   parseScope("scopes.root.user.name")  → ["root", "user.name"]
 *   parseScope("root.count")             → ["root", "count"]   (prefix optional)
 *
 * `prefix` (default `"scopes"`) is the leading namespace identifier the dotted
 * key is written against; it builds the `scopesPrefix` (`prefix + "."`) that
 * gets stripped. Pass a different value when keys are written against another
 * root identifier.
 *
 * This is the scope-layer counterpart to `createProxyScope`: `extractDeps`
 * produces `scopes.X.Y` read strings, and the renderer hands each to
 * `parseScope(...)` to route an `$emitter.on(targetPath, …)` subscription.
 */
export const parseScope = (key: string, prefix = "scopes") => {
  // Strip the "<prefix>." namespace token if present.
  const scopesPrefix = `${prefix}.`;
  const normalizedKey = key.startsWith(scopesPrefix)
    ? key.slice(scopesPrefix.length)
    : key;

  const dotIndex = normalizedKey.indexOf(".");
  if (dotIndex === -1) {
    throw new Error("Invalid scope key: " + key);
  } else {
    return [
      normalizedKey.slice(0, dotIndex),
      normalizedKey.slice(dotIndex + 1),
    ] as [string, string];
  }
};
