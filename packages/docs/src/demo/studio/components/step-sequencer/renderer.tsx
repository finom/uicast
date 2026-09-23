import { createComponentImplementation } from "@uicast/react";
import { StepSequencerDef } from "./def";

export const StepSequencerRenderer = createComponentImplementation({
  def: StepSequencerDef,
  render: ({
    tracks,
    steps,
    pattern,
    playhead,
    onToggle,
  }, { entry }) => {
    return (
      <div data-key={entry.key} className="flex select-none flex-col gap-1.5">
        {tracks.map((track, ti) => (
          <div key={track.id} className="flex items-center gap-2">
            <span className="w-12 shrink-0 text-right text-xs font-medium text-muted-foreground">
              {track.label}
            </span>
            <div className="flex flex-1 gap-1">
              {Array.from({ length: steps }, (_, si) => {
                const on = pattern[ti]?.[si] ?? false;
                const isBeat = si % 4 === 0;
                const offClass = isBeat
                  ? "border-border bg-muted hover:bg-muted/70"
                  : "border-border/50 bg-muted/40 hover:bg-muted/60";
                return (
                  <button
                    key={si}
                    type="button"
                    aria-pressed={on}
                    aria-label={`${track.label} step ${si + 1}`}
                    onClick={() =>
                      onToggle({
                        track: track.id,
                        trackIndex: ti,
                        step: si,
                        on: !on,
                      })
                    }
                    className={[
                      "h-7 flex-1 rounded-sm border transition",
                      on ? "border-primary bg-primary" : offClass,
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
