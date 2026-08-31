import { isComponentEntry, type ComponentEntry } from "@uicast/core";

/** The fence language token that routes a code block to the uicast Renderer. */
export const FENCE_LANGUAGE = "uicast";

/**
 * Parse a ```uicast fence body into ComponentEntry lines. Streaming-safe:
 * unparseable lines (the incomplete last line, stray prose) are skipped.
 *
 * Pass a `cache` (one per fence block) so an unchanged line returns the same
 * object across re-parses. The engine keys on entry identity — store wake-ups,
 * failed-seed retries, boundary resets — so re-minting entries every tick
 * would re-render settled nodes and retry failed seeds on every token.
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
