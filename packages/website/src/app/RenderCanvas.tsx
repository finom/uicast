"use client";
import Skeleton from "react-loading-skeleton";
import { ConfirmModalProvider } from "@ui-fired/catalog/components/ConfirmModal";
import { componentRenderers } from "@ui-fired/catalog/render/renderers";
import type { Fired } from "@ui-fired/core/types";
import { Renderer } from "@ui-fired/react";
import { inventoryFunctions } from "../lib/functions";

// Host-supplied placeholder: shown while a chunk hasn't streamed in yet, and as
// the Suspense fallback while a component's async `defaults` load. Components
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
const rendererComponents = { placeholder: Placeholder };

/**
 * The right-hand pane: the engine rendering the revealed chunks with the real
 * catalog components + our Dexie-backed functions. `ConfirmModalProvider` (from
 * the catalog) routes every `confirm:` in a callback through the shadcn modal.
 */
export function RenderCanvas({ lines }: { lines: Fired.Element[] }) {
  return (
    <ConfirmModalProvider>
      <Renderer
        catalog={componentRenderers}
        lines={lines}
        functions={inventoryFunctions}
        components={rendererComponents}
      />
    </ConfirmModalProvider>
  );
}
