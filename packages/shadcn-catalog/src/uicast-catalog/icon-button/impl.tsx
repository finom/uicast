import { createComponentImplementation } from "@uicast/react";
import { pickMouseEvent } from "../../events/mouse";
import { Button } from "../../components/ui/button";
import { iconNode } from "../../lib/icon-node";
import { IconButtonDef } from "./def";

const SIZES = { sm: "size-8", default: "size-9", lg: "size-10" } as const;

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
    return (
      <Button
        variant={variant}
        size="icon"
        disabled={disabled}
        title={tooltip}
        onClick={(e) => onClick(pickMouseEvent(e))}
        data-key={entry.key}
        className={SIZES[size]}
      >
        {iconNode(icon, "size-4")}
      </Button>
    );
  },
});
