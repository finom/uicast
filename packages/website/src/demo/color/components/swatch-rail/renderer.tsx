"use client";
import { createAIComponentRenderer } from "@ui-fired/react";
import { hexToHsl } from "../../colors";
import { SwatchRailDef } from "./def";

export const SwatchRailRenderer = createAIComponentRenderer({
  def: SwatchRailDef,
  renderer: ({ swatches = [], selected, onSelect, generatedKey }) => {
    return (
      <div data-key={generatedKey} className="flex flex-wrap gap-2">
        {swatches.map((hex, i) => {
          const isSel = selected?.toLowerCase() === hex.toLowerCase();
          return (
            <button
              // biome-ignore lint/suspicious/noArrayIndexKey: swatches may repeat; index disambiguates
              key={`${hex}-${i}`}
              type="button"
              aria-label={hex}
              aria-pressed={isSel}
              onClick={() => onSelect?.({ index: i, hex, ...hexToHsl(hex) })}
              className={[
                "size-9 rounded-md border-2 transition",
                isSel
                  ? "border-foreground"
                  : "border-border hover:border-foreground/40",
              ].join(" ")}
              style={{ backgroundColor: hex }}
            />
          );
        })}
      </div>
    );
  },
});
