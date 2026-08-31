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
// Width-aware pretty-printing: a node prints on one line when it fits, and
// expands only when it doesn't — `JSON.stringify(…, null, 2)` would put every
// `children` key on its own line and triple the block's height.
const WIDTH = 64;

function inline(value: unknown): string {
  if (Array.isArray(value)) {
    return value.length ? `[${value.map(inline).join(", ")}]` : "[]";
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value);
    if (!entries.length) return "{}";
    const body = entries
      .map(([key, v]) => `${JSON.stringify(key)}: ${inline(v)}`)
      .join(", ");
    return `{ ${body} }`;
  }
  return JSON.stringify(value);
}

function format(value: unknown, depth: number): string {
  const flat = inline(value);
  if (flat.length + depth * 2 <= WIDTH) return flat;
  const pad = "  ".repeat(depth + 1);
  const close = "  ".repeat(depth);
  if (Array.isArray(value)) {
    const body = value.map((v) => pad + format(v, depth + 1)).join(",\n");
    return `[\n${body}\n${close}]`;
  }
  if (value && typeof value === "object") {
    const body = Object.entries(value)
      .map(([key, v]) => `${pad}${JSON.stringify(key)}: ${format(v, depth + 1)}`)
      .join(",\n");
    return `{\n${body}\n${close}}`;
  }
  return flat;
}

export function entryVariants(entries: unknown[]): CodeVariant[] {
  return [
    {
      label: "JSONLines",
      code: entries.map((entry) => JSON.stringify(entry)).join("\n"),
      lang: "json",
    },
    { label: "JSON", code: format(entries, 0), lang: "json" },
  ];
}

/** Index of the variant `entryVariants` opens on — the pretty-printed JSON. */
export const ENTRY_DEFAULT_VARIANT = 1;
