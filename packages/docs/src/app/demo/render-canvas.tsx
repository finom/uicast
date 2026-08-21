"use client";
import Skeleton from "react-loading-skeleton";
import {
  ConfirmModal,
  RenderError,
} from "@uicast/shadcn-catalog/default-components";
import type { ComponentEntry } from "uicast";
import {
  type ComponentImplementation,
  Renderer,
  RendererConfigProvider,
} from "@uicast/react";
import type { DefaultComponents } from "@uicast/react/types";
import type { StandardToolV0 } from "standard-tool";

// Host-supplied placeholder: shown while an entry hasn't streamed in yet, and as
// the Suspense fallback while a component's async `seed` load. Components
// that ship their own placeholder (the Table family) keep theirs; everything
// else (Card / Stat / Chart / layout containers) falls back to this shimmer.
// Defined at module scope = stable reference, so it never churns the Renderer's
// registry context (which would re-render the whole tree).
//
// `containerClassName` matters for flex parents: react-loading-skeleton's inner
// span is `width:100%`, but its wrapper span is inline with no intrinsic width,
// so as an auto-sized flex *item* on a row's main axis it collapses to ~0 (an
// unstreamed child of a FlexRow would render invisible). `block w-full` gives
// the wrapper a definite width — full-width in a column, shrinking to an equal
// share between siblings in a row — and `[&_br]:hidden` drops the library's
// trailing <br> so the height stays a clean 64px instead of a blank extra line.
//
// Colors are driven off the theme `--muted` token instead of the library's
// hardcoded light-grays (#ebebeb/#f5f5f5), which would glare bright-white in
// dark mode. The highlight is `--muted` lightened toward white via color-mix,
// so the sweep keeps visible contrast in both themes.
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
 * catalog's `ConfirmModal`, passed via the `defaultComponents.confirm` slot, routes
 * every `confirm:` in a callback through the shadcn modal.
 */
export function RenderCanvas({
  lines,
  catalog,
  functions,
  defaultComponents,
  outlineKey,
  onHoverKey,
}: {
  lines: ComponentEntry[];
  catalog: ComponentImplementation[];
  functions: StandardToolV0[];
  defaultComponents?: DefaultComponents;
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
        <RendererConfigProvider
          defaultComponents={defaultComponents ?? DEFAULT_COMPONENTS}
        >
          <Renderer
            implementations={catalog}
            entries={lines}
            functions={functions}
          />
        </RendererConfigProvider>
      </div>
    </>
  );
}
