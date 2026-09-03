// Split a read path into `[scopeName, path]`, stripping a leading `"scopes."`: `parseScope("scopes.root.user.name")` → `["root", "user.name"]`.
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

// The dependency a read path subscribes to: its scope and first field, `scopes.root.user.name` → `scopes.root.user`.
// A bare scope (`Object.keys(scopes.root)`) reads every field: `scopes.root.*`.
export const depKey = (path: string): string | null => {
  const parts = (path.startsWith("scopes.") ? path.slice(7) : path).split(".");
  if (!parts[0]) return null;
  return parts.length >= 2 && parts[1] ? `scopes.${parts[0]}.${parts[1]}` : `scopes.${parts[0]}.*`;
};
