import { isComponentEntry, type ComponentEntry } from "@ui-fired/core";

/** The fence language token that routes a code block to the ui-fired Renderer. */
export const FENCE_LANGUAGE = "uifired";

/**
 * Parse the body of a ```uifired fence into ComponentEntry lines.
 *
 * Streaming-safe: a line that does not parse as JSON (typically the
 * still-incomplete last line of a streaming fence, or stray prose) is
 * skipped, so the result is always the complete entries emitted so far.
 *
 * Pass a `cache` (one per fence block) to keep entry object identity stable
 * across streaming re-parses: an unchanged line returns the same object the
 * previous tick produced. The engine keys on entry identity — per-key store
 * wake-ups, failed-seed retry gating, and error-boundary reset all compare
 * objects — so re-minting entries every tick would re-render settled nodes
 * and retry failed seeds on every token. Two byte-identical duplicate lines
 * share one object, which matches replacement semantics: re-emitting an
 * identical line is a no-op replacement.
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
