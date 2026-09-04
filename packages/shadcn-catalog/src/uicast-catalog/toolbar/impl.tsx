import { createComponentImplementation, type PlaceholderComponentProps } from "@uicast/react";
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
  placeholder: ({ children }: PlaceholderComponentProps) => <div className="flex flex-row items-center gap-2">{children}</div>,
});
