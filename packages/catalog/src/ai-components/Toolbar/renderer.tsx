import { createAIComponentRenderer } from "@ui-fired/core/render/createAIComponentRenderer";
import { cn } from "@ui-fired/core/lib/utils";
import { ToolbarDef } from "./def";

export const ToolbarRenderer = createAIComponentRenderer({
  def: ToolbarDef,
  renderer: ({
    variant = "default",
    size = "default",
    children,
    generatedKey,
  }) => {
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
        data-key={generatedKey}
      >
        {children}
      </div>
    );
  },
});
