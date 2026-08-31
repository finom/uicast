"use client";
import Skeleton from "react-loading-skeleton";
import {
  ConfirmModal,
  RenderError,
} from "@uicast/shadcn-catalog/fallback-components";
import type { ComponentEntry } from "@uicast/core";
import {
  type ComponentImplementation,
  EntriesRenderer,
  RendererProvider,
} from "@uicast/react";
import type { FallbackComponents } from "@uicast/react";
import type { StandardToolV0 } from "standard-tool";

// Host-supplied placeholder: shown while an entry hasn't streamed in yet, and
// as the Suspense fallback while a component's async `seed` loads. Defined at
// module scope = stable reference, so it never churns the Renderer's registry
// context. `containerClassName` fixes flex parents: react-loading-skeleton's
// wrapper span is inline with no intrinsic width and collapses to ~0 as a flex
// item — `block w-full` gives it a definite width, and `[&_br]:hidden` drops
// the library's trailing <br>. Colors ride the theme `--muted` token instead of
// the library's hardcoded light-grays, which would glare in dark mode.
const Placeholder = () => (
  <Skeleton
    height={64}
    borderRadius={8}
    baseColor="var(--muted)"
    highlightColor="color-mix(in oklch, var(--muted) 60%, white)"
    containerClassName="block w-full [&_br]:hidden"
  />
);
const DEFAULT_COMPONENTS = {
  placeholder: Placeholder,
  confirm: ConfirmModal,
  error: RenderError,
};

/**
 * The right-hand pane: the engine rendering the revealed entries with the demo's
 * catalog + host functions (both supplied by the active `DemoConfig`). The
 * catalog's `ConfirmModal`, passed via the `fallbackComponents.confirm` slot, routes
 * every `confirm:` in a callback through the shadcn modal.
 */
export function RenderCanvas({
  lines,
  catalog,
  functions,
  fallbackComponents,
  outlineKey,
  onHoverKey,
}: {
  lines: ComponentEntry[];
  catalog: ComponentImplementation[];
  functions: StandardToolV0[];
  fallbackComponents?: FallbackComponents;
  outlineKey: string | null;
  onHoverKey: (key: string | null) => void;
}) {
  // Bidirectional hover-highlight: every catalog renderer stamps its root node
  // with `data-key={element.key}`, so a hovered DOM node maps back to its entry
  // key via the nearest `[data-key]` ancestor (event delegation on the wrapper).
  // `onHoverKey` reports element hovers (which highlight the matching JSON line);
  // `outlineKey` is set by the parent *only* when the hover comes from a line, so
  // pointing at the rendered app never outlines it — the live UI stays normal.
  return (
    <>
      {outlineKey != null && (
        <style>{`[data-render-canvas] [data-key="${CSS.escape(outlineKey)}"]{outline:2px solid var(--primary);outline-offset:2px;border-radius:4px}`}</style>
      )}
      <div
        data-render-canvas=""
        onMouseOver={(e) => {
          const el = (e.target as HTMLElement).closest("[data-key]");
          onHoverKey(el?.getAttribute("data-key") ?? null);
        }}
        onMouseLeave={() => onHoverKey(null)}
      >
        <RendererProvider
          implementations={catalog}
          functions={functions}
          fallbackComponents={fallbackComponents ?? DEFAULT_COMPONENTS}
        >
          <EntriesRenderer entries={lines} />
        </RendererProvider>
      </div>
    </>
  );
}
