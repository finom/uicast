/**
 * Split a scope key into `[scopeName, leafPath]`, stripping a leading
 * `"scopes."` if present:
 *
 *   parseScope("scopes.root.user.name") → ["root", "user.name"]
 *   parseScope("root.count")            → ["root", "count"]
 *
 * The renderer feeds it `extractDeps` read strings to route
 * `$emitter.on(targetPath, …)` subscriptions.
 */
export const parseScope = (key: string) => {
  const normalizedKey = key.startsWith("scopes.") ? key.slice(7) : key;

  const dotIndex = normalizedKey.indexOf(".");
  if (dotIndex === -1) {
    throw new Error(`Invalid scope key: ${key}`);
  }
  return [
    normalizedKey.slice(0, dotIndex),
    normalizedKey.slice(dotIndex + 1),
  ] as [string, string];
};
