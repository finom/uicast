import type { ChunkComponent } from "../types";

export const parseScope = (key: string) => {
  // Strip "scopes." prefix if present
  const scopesPrefix = "scopes.";
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

/**
 * Collect all descendant IDs of a given chunk (not including the chunk itself)
 * by walking its children array recursively.
 */
function collectDescendantIds(
  id: string,
  map: Record<string, ChunkComponent>,
): Set<string> {
  const result = new Set<string>();
  const stack = [id];
  while (stack.length > 0) {
    const current = stack.pop()!;
    const chunk = map[current];
    if (chunk?.children) {
      for (const childId of chunk.children) {
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
 * When a chunk with a duplicate key is encountered (i.e. the LLM re-emits a
 * chunk to correct a mistake), all old descendants of that chunk are removed
 * from the map before inserting the replacement. This lets the LLM fix a
 * subtree by re-emitting just the broken chunk and its new children, without
 * regenerating the entire tree.
 */
export function buildElementsById(
  lines: ChunkComponent[],
): Record<string, ChunkComponent> {
  const map: Record<string, ChunkComponent> = {};

  for (const line of lines) {
    if (map[line.key]) {
      // Chunk already exists — remove all its old descendants before replacing
      const oldDescendants = collectDescendantIds(line.key, map);
      for (const descId of oldDescendants) {
        delete map[descId];
      }
    }
    map[line.key] = line;
  }

  return map;
}
