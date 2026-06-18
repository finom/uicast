import { createComponentImplementation } from "@ui-fired/react";
import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { IconDef } from "./def";

export const IconImpl = createComponentImplementation({
  def: IconDef,
  render: ({ name, size = "md", color, generatedKey }) => {
    const sizeMap: Record<string, string> = {
      sm: "size-4",
      md: "size-5",
      lg: "size-6",
      xl: "size-8",
    };
    const IconComponent = (
      LucideIcons as unknown as Record<string, LucideIcon>
    )[name];
    if (!IconComponent) {
      return (
        <span className="text-muted-foreground text-xs" data-key={generatedKey}>
          [{name}]
        </span>
      );
    }
    return (
      <span data-key={generatedKey}>
        <IconComponent
          className={`${sizeMap[size]} ${color ? `text-${color}` : ""}`}
        />
      </span>
    );
  },
});
