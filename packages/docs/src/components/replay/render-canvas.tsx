"use client";
import { memo, useMemo } from "react";
import Skeleton from "react-loading-skeleton";
import type { StandardToolV0 } from "standard-tool";
import type { ComponentEntry } from "@uicast/core";
import { Evaluator } from "@uicast/expr";
import { type ComponentImplementation, EntriesRenderer, RendererProvider } from "@uicast/react";
import { ConfirmModal, RenderError } from "@uicast/shadcn-catalog";

// Sized in em to fit inline text and headings; `containerClassName` gives the inline wrapper a width inside flex parents
// and hides its trailing <br>.
const DefaultSkeleton = () => (
  <Skeleton
    height="1.25em"
    borderRadius="0.4em"
    baseColor="var(--muted)"
    highlightColor="color-mix(in oklch, var(--muted) 60%, white)"
    containerClassName="block w-full [&_br]:hidden"
  />
);
const DEFAULT_COMPONENTS = { defaultSkeleton: DefaultSkeleton, confirm: ConfirmModal, error: RenderError };
// The shop's product photos.
const URL_POLICY = { hosts: ["images.unsplash.com"] };

type RenderCanvasProps = {
  lines: ComponentEntry[];
  catalog: ComponentImplementation[];
  functions: StandardToolV0[];
  outlineKey: string | null;
  onHoverKey: (key: string | null) => void;
};

// Memoized: the player re-renders on every typing tick, and the document only changes per line.
export const RenderCanvas = memo(function RenderCanvas({
  lines,
  catalog,
  functions,
  outlineKey,
  onHoverKey,
}: RenderCanvasProps) {
  // One evaluator per tool set: it holds the parse cache.
  const evaluator = useMemo(() => new Evaluator({ functions }), [functions]);
  // Every catalog renderer stamps its root with `data-key`, so a hovered node maps back to its line.
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
          fallbackComponents={DEFAULT_COMPONENTS}
          urlPolicy={URL_POLICY}
        >
          <EntriesRenderer entries={lines} />
        </RendererProvider>
      </div>
    </>
  );
});
