import { createComponentImplementation } from "@uicast/react";
import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { IconDef } from "./def";

export const IconImpl = createComponentImplementation({
  def: IconDef,
  render: ({ name, size, color, generatedKey }) => {
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
        {/* Color via the theme variable, not a composed `text-${color}` class —
            Tailwind only generates CSS for class names visible in source, so a
            runtime-built class would never get styles. */}
        <IconComponent
          className={sizeMap[size]}
          style={color ? { color: `var(--color-${color})` } : undefined}
        />
      </span>
    );
  },
});
