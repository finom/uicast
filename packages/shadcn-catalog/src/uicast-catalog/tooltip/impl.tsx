import { createComponentImplementation } from "@uicast/react";
import {
  Tooltip as ShadcnTooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../components/ui/tooltip";
import { TooltipDef } from "./def";

export const TooltipImpl = createComponentImplementation({
  def: TooltipDef,
  render: ({ content, side, children }, { entry }) => (
    <TooltipProvider>
      <ShadcnTooltip>
        {/* The provider renders no DOM node, so the trigger span carries the data-key. */}
        <TooltipTrigger asChild>
          <span data-key={entry.key}>{children}</span>
        </TooltipTrigger>
        <TooltipContent side={side}>
          <p>{content}</p>
        </TooltipContent>
      </ShadcnTooltip>
    </TooltipProvider>
  ),
});
