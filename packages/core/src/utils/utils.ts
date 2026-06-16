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
 * entry to correct a mistake), all old descendants of that entry are removed
 * from the map before inserting the replacement. This lets the LLM fix a
 * subtree by re-emitting just the broken entry and its new children, without
 * regenerating the entire tree.
 */
export function buildElementsById(
  lines: ComponentEntry[],
): Record<string, ComponentEntry> {
  const map: Record<string, ComponentEntry> = {};

  for (const line of lines) {
    if (map[line.key]) {
      // Entry already exists — remove all its old descendants before replacing
      const oldDescendants = collectDescendantIds(line.key, map);
      for (const descId of oldDescendants) {
        delete map[descId];
      }
    }
    map[line.key] = line;
  }

  return map;
}
