import { createComponentImplementation } from "@uicast/react";
import { Skeleton as ShadcnSkeleton } from "../../components/ui/skeleton";
import { SkeletonDef } from "./def";
import { height as toHeight, width as toWidth } from "../../lib/sizes";

export const SkeletonImpl = createComponentImplementation({
  def: SkeletonDef,
  render: ({
    width,
    height,
    rounded,
  }, { entry }) => {
    const radiusMap: Record<string, string> = {
      sm: "rounded-sm",
      md: "rounded-md",
      lg: "rounded-lg",
      full: "rounded-full",
    };
    return (
      <ShadcnSkeleton
        className={radiusMap[rounded]}
        style={{ width: toWidth(width), height: toHeight(height) }}
        data-key={entry.key}
      />
    );
  },
});
