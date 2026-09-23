import { createComponentImplementation } from "@uicast/react";
import { Skeleton } from "../../components/ui/skeleton";
import { cn } from "../../lib/utils";
import { GAP } from "../../lib/layout";
import { ContainerDef } from "./def";

export const ContainerImpl = createComponentImplementation({
  def: ContainerDef,
  render: ({
    maxWidth,
    padding,
    gap,
    children,
  }, { entry }) => {
    return (
      <div
        className={cn(
          "mx-auto flex w-full flex-col",
          GAP[gap],
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
        data-key={entry.key}
      >
        {children}
      </div>
    );
  },
  placeholder: ({ children }) => (
    <div className="flex flex-col gap-3 rounded-lg border p-4">
      <Skeleton className="h-4 w-40" />
      {children}
    </div>
  ),
});
