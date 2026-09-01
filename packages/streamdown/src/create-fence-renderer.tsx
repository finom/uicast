"use client";
import { type CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import type { ComponentEntry } from "@uicast/core";
import { EntriesRenderer } from "@uicast/react";
import type { CustomRenderer, CustomRendererProps } from "streamdown";
import { FENCE_LANGUAGE, parseFenceCode } from "./parse-fence-code";

export type FenceRendererOptions = {
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
 * Streamdown renderer for ```uicast fences; wrap the chat in one
 * <RendererProvider>. Call ONCE per option set and reuse — a fresh component
 * type per render remounts every block and wipes state.
 */
export function createFenceRenderer(options: FenceRendererOptions = {}): CustomRenderer {
  const { showSourceToggle = false } = options;
  function FenceBlock({ code, isIncomplete }: CustomRendererProps) {
    // One cache per block keeps entry identity stable across streaming re-parses — see parseFenceCode.
    const cacheRef = useRef<Map<string, ComponentEntry> | null>(null);
    if (!cacheRef.current) cacheRef.current = new Map();
    const cache = cacheRef.current;
    const entries = useMemo(() => parseFenceCode(code, cache), [code, cache]);
    const [view, setView] = useState<"rendered" | "source">("rendered");
    // Seeds and tool calls must never run during SSR (tools fetch with
    // browser-relative URLs) — mount the Renderer client-side only.
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    const rendered = mounted ? <EntriesRenderer entries={entries} /> : null;
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
        {/* Keep the block mounted while source shows — a remount would re-run seeds and wipe block state. */}
        <div hidden={view !== "rendered"}>{rendered}</div>
        {view === "source" && <pre style={sourceStyle}>{code}</pre>}
      </div>
    );
  }
  return { language: FENCE_LANGUAGE, component: FenceBlock };
}
