"use client";
import { createAIComponentRenderer } from "@ui-fired/react";
import { StepSequencerDef } from "./def";

export const StepSequencerRenderer = createAIComponentRenderer({
  def: StepSequencerDef,
  renderer: ({
    tracks = [],
    steps = 16,
    pattern = [],
    playhead = -1,
    onToggle,
    generatedKey,
  }) => {
    return (
      <div data-key={generatedKey} className="flex select-none flex-col gap-1.5">
        {tracks.map((track, ti) => (
          <div key={track.id} className="flex items-center gap-2">
            <span className="w-12 shrink-0 text-right text-xs font-medium text-muted-foreground">
              {track.label}
            </span>
            <div className="flex flex-1 gap-1">
              {Array.from({ length: steps }, (_, si) => {
                const on = pattern[ti]?.[si] ?? false;
                const isBeat = si % 4 === 0;
                return (
                  <button
                    // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length grid
                    key={si}
                    type="button"
                    aria-pressed={on}
                    aria-label={`${track.label} step ${si + 1}`}
                    onClick={() =>
                      onToggle?.({
                        track: track.id,
                        trackIndex: ti,
                        step: si,
                        on: !on,
                      })
                    }
                    className={[
                      "h-7 flex-1 rounded-sm border transition",
                      on
                        ? "border-primary bg-primary"
                        : isBeat
                          ? "border-border bg-muted hover:bg-muted/70"
                          : "border-border/50 bg-muted/40 hover:bg-muted/60",
                      playhead === si ? "ring-2 ring-primary/50" : "",
                    ].join(" ")}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  },
});
