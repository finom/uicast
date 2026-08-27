import type { CodeVariant } from "./mini-example";

/**
 * The two ways to read the same document: **JSONLines** — what actually
 * streams, one entry per line — and **JSON**, the same entries pretty-printed
 * as an array so nesting is readable. JSONLines comes first, so it is the one
 * shown by default; the wire format is the thing being taught.
 *
 * Lives outside `mini-example.tsx` because that file is `"use client"`, and a
 * server component can't call a function exported from a client module.
 */
export function entryVariants(entries: unknown[]): CodeVariant[] {
  return [
    {
      label: "JSONLines",
      code: entries.map((entry) => JSON.stringify(entry)).join("\n"),
      lang: "json",
    },
    { label: "JSON", code: JSON.stringify(entries, null, 2), lang: "json" },
  ];
}
