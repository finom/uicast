import { createComponentImplementation } from "@uicast/react";
import { cn } from "../../lib/utils";
import { ContainerDef } from "./def";

export const ContainerImpl = createComponentImplementation({
  def: ContainerDef,
  render: ({
    maxWidth = "lg",
    padding = "default",
    gap = "6",
    children,
    generatedKey,
  }) => {
    // Static map: Tailwind only compiles class names that appear literally in
    // source — a runtime-built `gap-${gap}` never generates CSS.
    const gapMap: Record<string, string> = {
      "0": "gap-0",
      "1": "gap-1",
      "2": "gap-2",
      "3": "gap-3",
      "4": "gap-4",
      "6": "gap-6",
      "8": "gap-8",
    };
    return (
      <div
        className={cn(
          "mx-auto flex w-full flex-col",
          gapMap[gap],
          maxWidth === "sm" && "max-w-screen-sm",
          maxWidth === "md" && "max-w-3xl",
          maxWidth === "lg" && "max-w-5xl",
          maxWidth === "xl" && "max-w-7xl",
          maxWidth === "2xl" && "max-w-screen-2xl",
          maxWidth === "full" && "max-w-full",
          padding === "none" && "px-0",
          padding === "sm" && "px-2",
          padding === "default" && "px-4",
          padding === "lg" && "px-8",
        )}
        data-key={generatedKey}
      >
        {children}
      </div>
    );
  },
});
