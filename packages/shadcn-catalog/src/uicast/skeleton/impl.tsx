import { createComponentImplementation } from "@uicast/react";
import { Skeleton as ShadcnSkeleton } from "../../components/ui/skeleton";
import { SkeletonDef } from "./def";

export const SkeletonImpl = createComponentImplementation({
  def: SkeletonDef,
  render: ({
    width,
    height,
    rounded,
    generatedKey,
  }) => {
    const radiusMap: Record<string, string> = {
      sm: "rounded-sm",
      md: "rounded-md",
      lg: "rounded-lg",
      full: "rounded-full",
    };
    return (
      <ShadcnSkeleton
        className={radiusMap[rounded]}
        style={{ width, height }}
        data-key={generatedKey}
      />
    );
  },
});
