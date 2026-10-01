import type { ComponentEntry } from "@uicast/core";
import type { ReactElement } from "react";
import { ResponsiveContainer } from "recharts";
import { busyClass, cn } from "./utils";

type ChartFrameProps = {
  entry: ComponentEntry;
  busy: boolean;
  height: number;
  children: ReactElement;
};

// Full width at a fixed height; min-w-0 lets a grid or flex track shrink it.
export const ChartFrame = ({ entry, busy, height, children }: ChartFrameProps) => (
  <div className={cn("relative w-full min-w-0", busyClass(busy))} aria-busy={busy || undefined} data-key={entry.key}>
    <ResponsiveContainer width="100%" height={height}>
      {children}
    </ResponsiveContainer>
  </div>
);
