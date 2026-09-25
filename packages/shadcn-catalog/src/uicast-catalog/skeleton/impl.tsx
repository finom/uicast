import { createComponentImplementation } from "@uicast/react";
import { Skeleton as ShadcnSkeleton } from "../../components/ui/skeleton";
import { height as toHeight, width as toWidth } from "../../lib/sizes";
import { SkeletonDef } from "./def";

const RADII = { sm: "rounded-sm", md: "rounded-md", lg: "rounded-lg", full: "rounded-full" };

export const SkeletonImpl = createComponentImplementation({
  def: SkeletonDef,
  render: ({ width, height, rounded }, { entry }) => (
    <ShadcnSkeleton
      className={RADII[rounded]}
      style={{ width: toWidth(width), height: toHeight(height) }}
      data-key={entry.key}
    />
  ),
});
