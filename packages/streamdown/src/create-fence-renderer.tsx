"use client";
import { type CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import type { ComponentEntry } from "uicast";
import { Renderer, type RendererProps } from "@uicast/react";
import type { CustomRenderer, CustomRendererProps } from "streamdown";
import { FENCE_LANGUAGE } from "./parse-fence-code";
import { parseFenceCode } from "./parse-fence-code";

export { FENCE_LANGUAGE } from "./parse-fence-code";

/** Renderer props minus `entries` — the entries come from the fence content. */
export type FenceRendererOptions = Omit<RendererProps, "entries"> & {
  /** Show a Rendered/Source switcher above each block. Default false. */
  showSourceToggle?: boolean;
};

// Chat hosts commonly wrap blocks in overflow:hidden; 1px padding keeps
// edge rings/shadows of rendered components from being clipped.
const blockStyle: CSSProperties = { padding: 1 };

const toggleRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 4,
  marginBottom: 4,
};

const sourceStyle: CSSProperties = {
  margin: 0,
  padding: 12,
  overflowX: "auto",
  fontSize: 12,
  lineHeight: 1.5,
  border: "1px solid color-mix(in srgb, currentColor 15%, transparent)",
  borderRadius: 6,
};

function toggleButtonStyle(active: boolean): CSSProperties {
  return {
    font: "inherit",
    fontSize: 12,
    padding: "2px 8px",
    background: "none",
    border: "1px solid",
    borderColor: active ? "color-mix(in srgb, currentColor 40%, transparent)" : "transparent",
    borderRadius: 4,
    cursor: "pointer",
    opacity: active ? 1 : 0.55,
  };
}

/**
 * Build a Streamdown custom renderer for ```uicast fences.
 *
 * Pass the result to Streamdown (or any wrapper that forwards its props,
 * e.g. AI Elements' Response): `plugins={{ renderers: [uicastRenderer] }}`.
 *
 * Call this ONCE per option set — at module scope or inside useMemo — and
 * reuse the returned object. The component's identity must stay stable
 * across streaming re-renders; a fresh component type per render would
 * remount the Renderer, re-running seeds and wiping the block's state.
 * While a fence streams, each completed JSONL line becomes an entry and
 * mounts progressively; the partial last line is ignored until it completes.
 */
export function createFenceRenderer(options: FenceRendererOptions): CustomRenderer {
  const { showSourceToggle = false, ...rendererProps } = options;
  function FenceBlock({ code, isIncomplete }: CustomRendererProps) {
    // Per-block parse cache: the engine keys on entry object identity (store
    // wake-ups, failed-seed retry gating, error-boundary reset), so unchanged
    // lines must yield the same objects across streaming re-parses.
    const cacheRef = useRef<Map<string, ComponentEntry> | null>(null);
    if (!cacheRef.current) cacheRef.current = new Map();
    const cache = cacheRef.current;
    const entries = useMemo(() => parseFenceCode(code, cache), [code, cache]);
    const [view, setView] = useState<"rendered" | "source">("rendered");
    // Seeds and tool calls must never run during SSR (tools fetch with
    // browser-relative URLs) — mount the Renderer client-side only.
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    const rendered = mounted ? <Renderer {...rendererProps} entries={entries} /> : null;
    if (!showSourceToggle) return <div style={blockStyle}>{rendered}</div>;
    // A just-opened fence that hasn't produced a complete entry yet would show
    // a toggle row above nothing — wait for content (or for the fence to
    // finish, so garbage-only fences still get the Source view).
    if (entries.length === 0 && isIncomplete) {
      return <div style={blockStyle}>{rendered}</div>;
    }
    return (
      <div style={blockStyle}>
        <div style={toggleRowStyle}>
          <button
            type="button"
            style={toggleButtonStyle(view === "rendered")}
            onClick={() => setView("rendered")}
          >
            Rendered
          </button>
          <button
            type="button"
            style={toggleButtonStyle(view === "source")}
            onClick={() => setView("source")}
          >
            Source
          </button>
        </div>
        {/* Keep the Renderer mounted while source shows — a remount would re-run seeds and wipe block state. */}
        <div hidden={view !== "rendered"}>{rendered}</div>
        {view === "source" && <pre style={sourceStyle}>{code}</pre>}
      </div>
    );
  }
  return { language: FENCE_LANGUAGE, component: FenceBlock };
}
