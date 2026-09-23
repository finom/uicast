import type { ComponentEntry } from "../types";

function collectDescendantKeys(
  id: string,
  map: Record<string, ComponentEntry>,
): Set<string> {
  const result = new Set<string>();
  const stack = [id];
  for (let current = stack.pop(); current !== undefined; current = stack.pop()) {
    const entry = map[current];
    if (entry?.children) {
      for (const childId of entry.children) {
        if (!result.has(childId)) {
          result.add(childId);
          stack.push(childId);
        }
      }
    }
  }
  return result;
}

// A re-emitted key replaces its subtree but keeps old children its new `children` array still names.
export function buildElementsByKey(
  lines: ComponentEntry[],
): Record<string, ComponentEntry> {
  // No prototype: keys are model-written, and `__proto__` or `toString` must be plain keys.
  const map: Record<string, ComponentEntry> = Object.create(null);

  for (const line of lines) {
    if (map[line.key]) {
      const oldDescendants = collectDescendantKeys(line.key, map);
      const kept = new Set<string>();
      const stack = [...(line.children ?? [])];
      for (let id = stack.pop(); id !== undefined; id = stack.pop()) {
        if (kept.has(id) || !oldDescendants.has(id)) continue;
        kept.add(id);
        const entry = map[id];
        if (entry?.children) stack.push(...entry.children);
      }
      for (const descId of oldDescendants) {
        if (!kept.has(descId)) delete map[descId];
      }
    }
    map[line.key] = line;
  }

  return map;
}
