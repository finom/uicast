import { createComponentImplementation } from "@uicast/react";
import { pickMouseEvent } from "../../events/mouse";
import { Button } from "../../components/ui/button";
import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { IconButtonDef } from "./def";

export const IconButtonImpl = createComponentImplementation({
  def: IconButtonDef,
  render: ({
    icon,
    variant,
    size,
    disabled,
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
        onClick={(e) => onClick(pickMouseEvent(e))}
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
