import { createComponentImplementation } from "@ui-fired/react";
import { Skeleton as ShadcnSkeleton } from "@ui-fired/catalog/components/ui/skeleton";
import { SkeletonDef } from "./def";

export const SkeletonImpl = createComponentImplementation({
  def: SkeletonDef,
  render: ({
    width = "100%",
    height = "1.25rem",
    rounded = "md",
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
