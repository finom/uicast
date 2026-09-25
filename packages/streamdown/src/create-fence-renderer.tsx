"use client";
import type { ComponentEntry } from "@uicast/core";
import { EntriesRenderer } from "@uicast/react";
import { type ComponentType, type CSSProperties, useEffect, useMemo, useState } from "react";
import { CodeBlock, type CustomRenderer, type CustomRendererProps } from "streamdown";
import { FENCE_LANGUAGE, parseFenceCode } from "./parse-fence-code";

/**
 * Props of your `sourceToggle` component.
 *
 * @example
 * const SourceToggle = ({ showSource, onShowSourceChange }: SourceToggleProps) => (
 *   <Toggle size="sm" pressed={showSource} onPressedChange={onShowSourceChange}>Source</Toggle>
 * );
 */
export type SourceToggleProps = {
  /** Whether the block shows its source now. */
  showSource: boolean;
  /** Call it with the new value to switch between the block and its source. */
  onShowSourceChange: (showSource: boolean) => void;
};

/**
 * Options for `createFenceRenderer`.
 *
 * @example
 * const fenceRenderer = createFenceRenderer({ sourceToggle: SourceToggle });
 */
export type FenceRendererOptions = {
  /** Your toggle, drawn above each block to switch it to its source. The block stays mounted while its source shows. */
  sourceToggle?: ComponentType<SourceToggleProps>;
  /** Render blocks in a server pass too: their seeds run, and call host functions, on the server. Default `false`. */
  ssr?: boolean;
};

// Chat hosts often wrap blocks in overflow:hidden; 1px keeps focus rings from being clipped.
const blockStyle: CSSProperties = { padding: 1 };

/**
 * The Streamdown renderer for `uicast` fences: each block mounts as an `<EntriesRenderer>` under your
 * `<RendererProvider>`. Call it once per option set and reuse it: a new one per render remounts every block.
 *
 * @example
 * const plugins = { renderers: [createFenceRenderer()] }; // module scope
 * <Streamdown plugins={plugins}>{markdown}</Streamdown>;
 *
 * @example
 * const fenceRenderer = createFenceRenderer({ sourceToggle: SourceToggle, ssr: true });
 */
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
