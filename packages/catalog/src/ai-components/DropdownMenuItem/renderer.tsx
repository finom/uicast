import { createAIComponentRenderer } from "@ui-fired/react";
import { DropdownMenuItem as ShadcnDropdownMenuItem } from "@ui-fired/catalog/components/ui/dropdown-menu";
import { pickClick } from "@ui-fired/catalog/render/shared";
import { DropdownMenuItemDef } from "./def";

export const DropdownMenuItemRenderer = createAIComponentRenderer({
  def: DropdownMenuItemDef,
  renderer: ({
    children,
    variant = "default",
    disabled = false,
    onClick,
    generatedKey,
  }) => {
    return (
      <ShadcnDropdownMenuItem
        variant={variant}
        disabled={disabled}
        onClick={(e) => onClick?.(pickClick(e))}
        data-key={generatedKey}
      >
        {children}
      </ShadcnDropdownMenuItem>
    );
  },
});
