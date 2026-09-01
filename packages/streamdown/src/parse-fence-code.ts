import { isComponentEntry, type ComponentEntry } from "@uicast/core";

/** The fence language token that routes a code block to the uicast Renderer. */
export const FENCE_LANGUAGE = "uicast";

/**
 * Fence body → ComponentEntry lines; unparseable lines (incomplete tail,
 * prose) are skipped. Pass a per-fence `cache` so unchanged lines keep
 * identity — re-minting entries retries failed seeds on every token.
 */
export function parseFenceCode(
  code: string,
  cache?: Map<string, ComponentEntry>,
): ComponentEntry[] {
  const entries: ComponentEntry[] = [];
  for (const line of code.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const cached = cache?.get(trimmed);
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
      cache?.set(trimmed, value);
    }
  }
  return entries;
}
