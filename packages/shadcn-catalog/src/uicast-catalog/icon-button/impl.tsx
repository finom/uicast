import { createComponentImplementation } from "@uicast/react";
import { pickMouseEvent } from "../../events/mouse";
import { Button } from "../../components/ui/button";
import { ICONS } from "../../lib/icons";
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
  }, { entry }) => {
    const IconComponent = ICONS[icon];
    return (
      <Button
        variant={variant}
        size="icon"
        disabled={disabled}
        title={tooltip}
        onClick={(e) => onClick(pickMouseEvent(e))}
        data-key={entry.key}
        className={
          size === "sm" ? "size-8" : size === "lg" ? "size-10" : "size-9"
        }
      >
        <IconComponent className="size-4" />
      </Button>
    );
  },
});
