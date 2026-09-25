import { createComponentImplementation } from "@uicast/react";
import { dragHandlers, fraction } from "../../../components/drag";
import { hslToHex } from "../../colors";
import { ColorFieldDef } from "./def";

const FIELD_BACKGROUND = (h: number) =>
  `linear-gradient(to top, #000, rgba(0,0,0,0) 50%, #fff), linear-gradient(to right, #808080, rgba(128,128,128,0)), hsl(${h} 100% 50%)`;
const HUE_BACKGROUND = "linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)";
const THUMB_SHADOW = "0 0 0 1.5px rgba(0,0,0,.5)";

// x = saturation, y = lightness (top = light).
export const ColorFieldImpl = createComponentImplementation({
  def: ColorFieldDef,
  render: ({ h, s, l, onPick }, { entry }) => (
    <div data-key={entry.key} className="flex select-none flex-col gap-3">
      <div
        className="relative aspect-4/3 w-full cursor-crosshair overflow-hidden rounded-lg border border-border"
        style={{ touchAction: "none", background: FIELD_BACKGROUND(h) }}
        {...dragHandlers((e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const ns = Math.round(fraction(e.clientX, r.left, r.width) * 100);
          const nl = Math.round((1 - fraction(e.clientY, r.top, r.height)) * 100);
          onPick({ hex: hslToHex(h, ns, nl), h, s: ns, l: nl });
        })}
      >
        <div
          className="absolute size-4 -translate-1/2 rounded-full border-2 border-white"
          style={{ left: `${s}%`, top: `${100 - l}%`, boxShadow: THUMB_SHADOW }}
        />
      </div>
      <div
        className="relative h-4 w-full cursor-ew-resize rounded-full border border-border"
        style={{ touchAction: "none", background: HUE_BACKGROUND }}
        {...dragHandlers((e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const nh = Math.round(fraction(e.clientX, r.left, r.width) * 360);
          onPick({ hex: hslToHex(nh, s, l), h: nh, s, l });
        })}
      >
        <div
          className="absolute top-1/2 size-5 -translate-1/2 rounded-full border-2 border-white"
          style={{ left: `${(h / 360) * 100}%`, boxShadow: THUMB_SHADOW }}
        />
      </div>
    </div>
  ),
});
