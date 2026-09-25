import { createComponentImplementation } from "@uicast/react";
import { GAP } from "../../lib/layout";
import { PanelSkeleton } from "../../lib/skeletons";
import { cn } from "../../lib/utils";
import { ContainerDef } from "./def";

const MAX_WIDTHS = {
  sm: "max-w-screen-sm",
  md: "max-w-3xl",
  lg: "max-w-5xl",
  xl: "max-w-7xl",
  "2xl": "max-w-screen-2xl",
  full: "max-w-full",
};
const PADDINGS = { none: "px-0", sm: "px-2", default: "px-4", lg: "px-8" };

export const ContainerImpl = createComponentImplementation({
  def: ContainerDef,
  render: ({ maxWidth, padding, gap, children }, { entry }) => (
    <div
      className={cn("mx-auto flex w-full flex-col", GAP[gap], MAX_WIDTHS[maxWidth], PADDINGS[padding])}
      data-key={entry.key}
    >
      {children}
    </div>
  ),
  skeleton: PanelSkeleton,
});
