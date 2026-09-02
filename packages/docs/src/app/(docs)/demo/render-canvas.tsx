"use client";
import { useMemo } from "react";
import Skeleton from "react-loading-skeleton";
import { Evaluator } from "@uicast/expr";
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
// context. When the slot fills a not-yet-streamed child the component is
// unknown, so the shimmer is sized like a line of local text (em-based): small
// inside table cells and badges, larger in headings — never a tall block where
// a pill belongs. `containerClassName` fixes flex parents:
// react-loading-skeleton's wrapper span is inline with no intrinsic width and
// collapses to ~0 as a flex item — `block w-full` gives it a definite width,
// and `[&_br]:hidden` drops the library's trailing <br>. Colors ride the theme
// `--muted` token instead of the library's hardcoded light-grays, which would
// glare in dark mode.
const Placeholder = () => (
  <Skeleton
    height="1.25em"
    borderRadius="0.4em"
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

// The right-hand pane: the engine over the revealed entries, with the active DemoConfig's catalog and host functions.
// The catalog's ConfirmModal, in the `fallbackComponents.confirm` slot, handles every `confirm:` step.
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
  // One evaluator per tool set — it holds the parse cache.
  const evaluator = useMemo(() => new Evaluator({ functions }), [functions]);
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
          evaluator={evaluator}
          fallbackComponents={fallbackComponents ?? DEFAULT_COMPONENTS}
        >
          <EntriesRenderer entries={lines} />
        </RendererProvider>
      </div>
    </>
  );
}
