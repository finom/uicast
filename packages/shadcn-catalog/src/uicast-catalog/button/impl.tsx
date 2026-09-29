import { createComponentImplementation } from "@uicast/react";
import { Button as ShadcnButton } from "../../components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../components/ui/tooltip";
import { pickMouseEvent } from "../../events/mouse";
import { ICONS } from "../../lib/icons";
import { cn } from "../../lib/utils";
import { ButtonDef } from "./def";

const SQUARE = { sm: "icon-sm", default: "icon", lg: "icon-lg" } as const;

export const ButtonImpl = createComponentImplementation({
  def: ButtonDef,
  render: ({ text, icon, children, variant, size, disabled, tooltip, onClick }, { entry }) => {
    const label = children ?? text;
    const square = label === undefined || label === "";
    const Icon = icon && ICONS[icon];
    const button = (
      <ShadcnButton
        type="button"
        variant={variant}
        size={square ? SQUARE[size] : size}
        disabled={disabled}
        aria-label={square ? tooltip : undefined}
        onClick={(e) => onClick(pickMouseEvent(e))}
        data-key={entry.key}
        // w-fit: a column or a grid cell would stretch it to the full width.
        // shadcn's lg only adds height; the text and the icon grow with it here.
        className={cn("w-fit", size === "lg" && "text-base [&_svg:not([class*='size-'])]:size-5")}
      >
        {Icon && <Icon data-icon="inline-start" />}
        {label}
      </ShadcnButton>
    );
    if (!tooltip) return button;
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent>{tooltip}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  },
});
