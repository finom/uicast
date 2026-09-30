"use client";
import { type ReactNode, useState } from "react";

const FADE = "linear-gradient(to bottom, #000 55%, transparent)";

// Clips its children to `height` pixels, faded out at the bottom, with a toggle for the rest.
export function ShowMore({ children, height = 240 }: { children: ReactNode; height?: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="not-first:mt-[1.25em]">
      <div
        className={open ? undefined : "overflow-hidden"}
        style={open ? undefined : { maxHeight: height, maskImage: FADE, WebkitMaskImage: FADE }}
      >
        {children}
      </div>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="mt-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        {open ? "Show less" : "Show more"}
      </button>
    </div>
  );
}
