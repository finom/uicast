import type { ComponentEntry } from "../types";

/**
 * Collect all descendant IDs of a given entry (not including the entry itself)
 * by walking its children array recursively.
 */
function collectDescendantIds(
  id: string,
  map: Record<string, ComponentEntry>,
): Set<string> {
  const result = new Set<string>();
  const stack = [id];
  while (stack.length > 0) {
    const current = stack.pop()!;
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
 * Build an elements-by-key map from the NDJSON lines array.
 *
 * When an entry with a duplicate key is encountered (i.e. the LLM re-emits a
 * entry to correct a mistake), the old subtree is removed before inserting
 * the replacement — except old nodes the new `children` array still
 * references (directly or through a kept child), which survive with their
 * own subtrees. This lets the LLM restructure a parent by re-emitting just
 * that entry, keeping existing children by reference, without regenerating
 * the entire tree.
 */
export function buildElementsById(
  lines: ComponentEntry[],
): Record<string, ComponentEntry> {
  const map: Record<string, ComponentEntry> = {};

  for (const line of lines) {
    if (map[line.key]) {
      const oldDescendants = collectDescendantIds(line.key, map);
      const kept = new Set<string>();
      const stack = [...(line.children ?? [])];
      while (stack.length > 0) {
        const id = stack.pop()!;
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
