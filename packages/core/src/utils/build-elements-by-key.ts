import type { ComponentEntry } from "../types";

/**
 * Collect all descendant keys of an entry (not including the entry itself)
 * by walking its children arrays recursively.
 */
function collectDescendantKeys(
  id: string,
  map: Record<string, ComponentEntry>,
): Set<string> {
  const result = new Set<string>();
  const stack = [id];
  while (stack.length > 0) {
    const current = stack.pop();
    if (current === undefined) break;
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

/**
 * Entries → elements-by-key map. A duplicate key replaces the old subtree,
 * keeping any old children the new `children` array still references — so one
 * re-emitted entry restructures without regenerating the tree.
 */
export function buildElementsByKey(
  lines: ComponentEntry[],
): Record<string, ComponentEntry> {
  const map: Record<string, ComponentEntry> = {};

  for (const line of lines) {
    if (map[line.key]) {
      const oldDescendants = collectDescendantKeys(line.key, map);
      const kept = new Set<string>();
      const stack = [...(line.children ?? [])];
      while (stack.length > 0) {
        const id = stack.pop();
        if (id === undefined) break;
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
