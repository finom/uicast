import type { ComponentEntry } from "./types";

// The keys reachable from `start` through `children`, optionally only those `within` a set.
const reachable = (map: Record<string, ComponentEntry>, start: readonly string[], within?: Set<string>): Set<string> => {
  const out = new Set<string>();
  const stack = [...start];
  for (let key = stack.pop(); key !== undefined; key = stack.pop()) {
    if (out.has(key) || (within && !within.has(key))) continue;
    out.add(key);
    stack.push(...(map[key]?.children ?? []));
  }
  return out;
};

// A re-emitted key replaces its subtree but keeps old children its new `children` array still names.
export function buildElementsByKey(lines: ComponentEntry[]): Record<string, ComponentEntry> {
  // No prototype: keys are model-written, and `__proto__` or `toString` must be plain keys.
  const map: Record<string, ComponentEntry> = Object.create(null);
  for (const line of lines) {
    const old = map[line.key];
    if (old) {
      const descendants = reachable(map, old.children ?? []);
      const kept = reachable(map, line.children ?? [], descendants);
      for (const key of descendants) if (!kept.has(key)) delete map[key];
    }
    map[line.key] = line;
  }
  return map;
}
