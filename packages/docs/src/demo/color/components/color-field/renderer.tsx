"use client";
import { createComponentImplementation } from "@uicast/react";
import { useRef } from "react";
import { hslToHex } from "../../colors";
import { ColorFieldDef } from "./def";

/** Two drag surfaces: the SL square (x = saturation, y = lightness, top = light) and a hue strip. */
export const ColorFieldRenderer = createComponentImplementation({
  def: ColorFieldDef,
  render: ({ h = 220, s = 80, l = 55, onPick, generatedKey }) => {
    const sqRef = useRef<HTMLDivElement>(null);
    const sqDrag = useRef(false);
    const hueRef = useRef<HTMLDivElement>(null);
    const hueDrag = useRef(false);

    const pickSquare = (cx: number, cy: number) => {
      const el = sqRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const ns = Math.round(Math.min(1, Math.max(0, (cx - r.left) / r.width)) * 100);
      const nl = Math.round(
        Math.min(1, Math.max(0, 1 - (cy - r.top) / r.height)) * 100,
      );
      onPick?.({ hex: hslToHex(h, ns, nl), h, s: ns, l: nl });
    };
    const pickHue = (cx: number) => {
      const el = hueRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const nh = Math.round(Math.min(1, Math.max(0, (cx - r.left) / r.width)) * 360);
      onPick?.({ hex: hslToHex(nh, s, l), h: nh, s, l });
    };

    return (
      <div data-key={generatedKey} className="flex select-none flex-col gap-3">
        <div
          ref={sqRef}
          className="relative aspect-4/3 w-full cursor-crosshair overflow-hidden rounded-lg border border-border"
          style={{
            touchAction: "none",
            background: `linear-gradient(to top, #000, rgba(0,0,0,0) 50%, #fff), linear-gradient(to right, #808080, rgba(128,128,128,0)), hsl(${h} 100% 50%)`,
          }}
          onPointerDown={(e) => {
            sqDrag.current = true;
            e.currentTarget.setPointerCapture(e.pointerId);
            pickSquare(e.clientX, e.clientY);
          }}
          onPointerMove={(e) => {
            if (sqDrag.current) pickSquare(e.clientX, e.clientY);
          }}
          onPointerUp={() => {
            sqDrag.current = false;
          }}
        >
          <div
            className="absolute size-4 -translate-1/2 rounded-full border-2 border-white"
            style={{
              left: `${s}%`,
              top: `${100 - l}%`,
              boxShadow: "0 0 0 1.5px rgba(0,0,0,.5)",
            }}
          />
        </div>
        <div
          ref={hueRef}
          className="relative h-4 w-full cursor-ew-resize rounded-full border border-border"
          style={{
            touchAction: "none",
            background:
              "linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)",
          }}
          onPointerDown={(e) => {
            hueDrag.current = true;
            e.currentTarget.setPointerCapture(e.pointerId);
            pickHue(e.clientX);
          }}
          onPointerMove={(e) => {
            if (hueDrag.current) pickHue(e.clientX);
          }}
          onPointerUp={() => {
            hueDrag.current = false;
          }}
        >
          <div
            className="absolute top-1/2 size-5 -translate-1/2 rounded-full border-2 border-white"
            style={{
              left: `${(h / 360) * 100}%`,
              boxShadow: "0 0 0 1.5px rgba(0,0,0,.5)",
            }}
          />
        </div>
      </div>
    );
  },
});
