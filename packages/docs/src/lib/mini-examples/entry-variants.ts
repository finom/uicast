import type { CodeVariant } from "./mini-example";

/**
 * The two ways to read the same document: **JSONLines** — what actually
 * streams, one entry per line — and **JSON**, the same entries pretty-printed
 * as an array so nesting is readable. JSONLines is listed first because it is
 * the wire format, but JSON opens selected (see `ENTRY_DEFAULT_VARIANT`): one
 * entry per line is dense to read cold, and the pretty-printed form is where a
 * newcomer can actually see the shape.
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

/** Index of the variant `entryVariants` opens on — the pretty-printed JSON. */
export const ENTRY_DEFAULT_VARIANT = 1;
