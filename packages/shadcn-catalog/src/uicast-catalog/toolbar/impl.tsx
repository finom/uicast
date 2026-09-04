import { createComponentImplementation } from "@uicast/react";
import { cn } from "../../lib/utils";
import { ToolbarDef } from "./def";

export const ToolbarImpl = createComponentImplementation({
  def: ToolbarDef,
  render: ({
    variant,
    size,
    children,
  }, { entry }) => {
    return (
      <div
        className={cn(
          "flex items-center gap-2",
          variant === "outlined" && "rounded-md border bg-background",
          size === "sm" && "p-1",
          size === "default" && "p-2",
          size === "lg" && "p-3",
        )}
        role="toolbar"
        data-key={entry.key}
      >
        {children}
      </div>
    );
  },
});
