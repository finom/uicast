import { createAIComponentRenderer } from "ui-fired/core/render/createAIComponentRenderer";
import { pickClick } from "ui-fired/core/render/shared";
import { Button } from "ui-fired/catalog/components/ui/button";
import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { IconButtonDef } from "./def";

export const IconButtonRenderer = createAIComponentRenderer({
  def: IconButtonDef,
  renderer: ({
    icon,
    variant = "ghost",
    size = "default",
    disabled = false,
    tooltip,
    onClick,
    generatedKey,
  }) => {
    const IconComponent = (
      LucideIcons as unknown as Record<string, LucideIcon>
    )[icon];
    return (
      <Button
        variant={variant}
        size="icon"
        disabled={disabled}
        title={tooltip}
        onClick={(e) => onClick?.(pickClick(e))}
        data-key={generatedKey}
        className={
          size === "sm" ? "size-8" : size === "lg" ? "size-10" : "size-9"
        }
      >
        {IconComponent ? (
          <IconComponent className="size-4" />
        ) : (
          <span className="text-xs">[{icon}]</span>
        )}
      </Button>
    );
  },
});
