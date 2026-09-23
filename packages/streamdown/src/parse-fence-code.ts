import { isComponentEntry, type ComponentEntry } from "@uicast/core";

export const FENCE_LANGUAGE = "uicast";

// A per-fence `cache` keeps an unchanged line's identity: a re-minted entry retries a failed seed on every token.
export function parseFenceCode(code: string, cache: Map<string, ComponentEntry>): ComponentEntry[] {
  const entries: ComponentEntry[] = [];
  for (const line of code.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const cached = cache.get(trimmed);
    if (cached) {
      entries.push(cached);
      continue;
    }
    let value: unknown;
    try {
      value = JSON.parse(trimmed);
    } catch {
      continue;
    }
    if (isComponentEntry(value)) {
      entries.push(value);
      cache.set(trimmed, value);
    }
  }
  return entries;
}
