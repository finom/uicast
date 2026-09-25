import type { PointerEvent } from "react";

// Calls `onPoint` on press and on every move until release: the element holds the pointer capture while pressed.
export const dragHandlers = (onPoint: (e: PointerEvent<HTMLDivElement>) => void) => ({
  onPointerDown: (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    onPoint(e);
  },
  onPointerMove: (e: PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) onPoint(e);
  },
});

// `value` as a 0..1 fraction of `size`, from `start`.
export const fraction = (value: number, start: number, size: number) => Math.min(1, Math.max(0, (value - start) / size));
