import type { CodePart, CodeVariant } from "./mini-example";

// Not in `mini-example.tsx`: that file is `"use client"`, and a server component cannot call a function exported from it.

// A node prints on one line when it fits; `JSON.stringify(…, null, 2)` would put every `children` key on its own line.
const WIDTH = 64;

function inline(value: unknown): string {
  if (Array.isArray(value)) {
    return value.length ? `[${value.map(inline).join(", ")}]` : "[]";
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value);
    if (!entries.length) return "{}";
    return `{ ${entries.map(([key, v]) => `${JSON.stringify(key)}: ${inline(v)}`).join(", ")} }`;
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

// The example's document, as JSONLines and as pretty-printed JSON (shown first).
export function entriesPart(entries: unknown[]): CodePart {
  const variants: CodeVariant[] = [
    { label: "JSONLines", code: entries.map((entry) => JSON.stringify(entry)).join("\n"), lang: "json" },
    { label: "JSON", code: format(entries, 0), lang: "json" },
  ];
  return { name: "Entries", prov: "llm", variants, defaultVariant: 1 };
}
