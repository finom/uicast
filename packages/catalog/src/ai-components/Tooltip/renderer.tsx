import { createAIComponentRenderer } from "@ui-fired/core/render/createAIComponentRenderer";
import {
  Tooltip as ShadcnTooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@ui-fired/catalog/components/ui/tooltip";
import { TooltipDef } from "./def";

export const TooltipRenderer = createAIComponentRenderer({
  def: TooltipDef,
  renderer: ({ content, side = "top", children, generatedKey }) => {
    return (
      <TooltipProvider data-key={generatedKey}>
        <ShadcnTooltip>
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
