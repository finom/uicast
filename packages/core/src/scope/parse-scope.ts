const PREFIX = "scopes.";

// "scopes.root.user.name" → ["root", "user.name"]
export const parseScope = (key: string): [string, string] => {
  const dot = key.indexOf(".", PREFIX.length);
  return [key.slice(PREFIX.length, dot), key.slice(dot + 1)];
};

// "scopes.root.user.name" → "scopes.root.user"; a bare scope reads every field: "scopes.root.*".
export const depKey = (path: string): string => {
  const [scope, field] = path.slice(PREFIX.length).split(".");
  return field ? `scopes.${scope}.${field}` : `scopes.${scope}.*`;
};
