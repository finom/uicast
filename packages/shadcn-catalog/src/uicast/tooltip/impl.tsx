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
  render: ({ content, side, children, generatedKey }) => {
    return (
      <TooltipProvider>
        <ShadcnTooltip>
          {/* The provider renders no DOM node — the trigger span is the
              outermost rendered element, so it carries the data-key. */}
          <TooltipTrigger asChild>
            <span data-key={generatedKey}>{children}</span>
          </TooltipTrigger>
          <TooltipContent side={side}>
            <p>{content}</p>
          </TooltipContent>
        </ShadcnTooltip>
      </TooltipProvider>
    );
  },
});
