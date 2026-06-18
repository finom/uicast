import { createComponentImplementation } from "@ui-fired/react";
import { cn } from "../../lib/utils";
import { ContainerDef } from "./def";

export const ContainerImpl = createComponentImplementation({
  def: ContainerDef,
  render: ({
    maxWidth = "lg",
    padding = "default",
    children,
    generatedKey,
  }) => {
    return (
      <div
        className={cn(
          "mx-auto w-full",
          maxWidth === "sm" && "max-w-screen-sm",
          maxWidth === "md" && "max-w-screen-md",
          maxWidth === "lg" && "max-w-screen-lg",
          maxWidth === "xl" && "max-w-screen-xl",
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
