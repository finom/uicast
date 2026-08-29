import { createComponentImplementation } from "@uicast/react";
import { DropdownMenuItem as ShadcnDropdownMenuItem } from "../../components/ui/dropdown-menu";
import { pickMouseEvent } from "../../events/mouse";
import { DropdownMenuItemDef } from "./def";

export const DropdownMenuItemImpl = createComponentImplementation({
  def: DropdownMenuItemDef,
  render: ({
    text,
    children,
    variant,
    disabled,
    onClick,
    generatedKey,
  }) => {
    return (
      <ShadcnDropdownMenuItem
        variant={variant}
        disabled={disabled}
        onClick={(e) => onClick(pickMouseEvent(e))}
        data-key={generatedKey}
      >
        {children ?? text}
      </ShadcnDropdownMenuItem>
    );
  },
});
