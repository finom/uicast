import type { ComponentEntry } from "@ui-fired/core";

function isEntry(value: unknown): value is ComponentEntry {
  return (
    !!value &&
    typeof value === "object" &&
    typeof (value as ComponentEntry).key === "string" &&
    typeof (value as ComponentEntry).component === "string"
  );
}

/**
 * Parse the body of a ```uifired fence into ComponentEntry lines.
 *
 * Streaming-safe: a line that does not parse as JSON (typically the
 * still-incomplete last line of a streaming fence, or stray prose) is
 * skipped, so the result is always the complete entries emitted so far.
 */
export function parseFenceCode(code: string): ComponentEntry[] {
  const entries: ComponentEntry[] = [];
  for (const line of code.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    let value: unknown;
    try {
      value = JSON.parse(trimmed);
    } catch {
      continue;
    }
    if (isEntry(value)) entries.push(value);
  }
  return entries;
}
