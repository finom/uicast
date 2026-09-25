"use client";
import type { ComponentEntry } from "@uicast/core";
import { EntriesRenderer } from "@uicast/react";
import { type ComponentType, type CSSProperties, useEffect, useMemo, useState } from "react";
import { CodeBlock, type CustomRenderer, type CustomRendererProps } from "streamdown";
import { FENCE_LANGUAGE, parseFenceCode } from "./parse-fence-code";

export type SourceToggleProps = {
  showSource: boolean;
  onShowSourceChange: (showSource: boolean) => void;
};

export type FenceRendererOptions = {
  // Drawn above each block; the block stays mounted while its source shows.
  sourceToggle?: ComponentType<SourceToggleProps>;
  // Render blocks in a server pass too: their seeds run and host functions are called on the server.
  ssr?: boolean;
};

// Chat hosts often wrap blocks in overflow:hidden; 1px keeps focus rings from being clipped.
const blockStyle: CSSProperties = { padding: 1 };

// Call once per option set and reuse: a fresh component type per render remounts every block.
export function createFenceRenderer({ sourceToggle: SourceToggle, ssr }: FenceRendererOptions = {}): CustomRenderer {
  function FenceBlock({ code, isIncomplete }: CustomRendererProps) {
    const [cache] = useState(() => new Map<string, ComponentEntry>());
    const entries = useMemo(() => parseFenceCode(code, cache), [code, cache]);
    const [showSource, setShowSource] = useState(false);
    // Tools usually fetch browser-relative URLs, so nothing runs in a server pass unless `ssr` is set.
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    const rendered = mounted || ssr ? <EntriesRenderer entries={entries} /> : null;
    // No toggle above nothing; a finished garbage-only fence still gets the source view.
    if (!SourceToggle || (entries.length === 0 && isIncomplete)) {
      return <div style={blockStyle}>{rendered}</div>;
    }
    return (
      <div style={blockStyle}>
        <SourceToggle showSource={showSource} onShowSourceChange={setShowSource} />
        {/* Keep the block mounted while source shows — a remount would re-run seeds and wipe block state. */}
        <div hidden={showSource}>{rendered}</div>
        {showSource && <CodeBlock code={code} language="jsonl" isIncomplete={isIncomplete} />}
      </div>
    );
  }
  return { language: FENCE_LANGUAGE, component: FenceBlock };
}
