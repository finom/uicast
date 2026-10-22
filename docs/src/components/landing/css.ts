import type { CSSProperties } from "react";

// biome-ignore lint/suspicious/noExplicitAny: the view model comes from the untyped landing-logic.js
export type V = any;

const cache = new Map<string, CSSProperties>();

// Turns the canvas's inline style strings into React style objects.
export function css(text: string): CSSProperties {
  let style = cache.get(text);
  if (style) return style;
  const out: Record<string, string> = {};
  for (const decl of text.split(";")) {
    const at = decl.indexOf(":");
    if (at < 0) continue;
    const name = decl.slice(0, at).trim();
    const value = decl.slice(at + 1).trim();
    if (!name) continue;
    out[name.startsWith("--") ? name : name.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())] = value;
  }
  style = out as CSSProperties;
  if (cache.size < 2000) cache.set(text, style);
  return style;
}
