import { createComponentImplementation } from "@ui-fired/react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../components/ui/popover";
import { Button } from "../../components/ui/button";
import { PopoverDef } from "./def";

export const PopoverImpl = createComponentImplementation({
  def: PopoverDef,
  render: ({
    open = false,
    triggerLabel,
    side = "bottom",
    children,
    onOpenChange,
    generatedKey,
  }) => {
    return (
      <span data-key={generatedKey}>
        <Popover open={open} onOpenChange={(v) => onOpenChange?.({ open: v })}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              {triggerLabel ?? "More"}
            </Button>
          </PopoverTrigger>
          <PopoverContent side={side} className="w-auto min-w-[200px]">
            {children}
          </PopoverContent>
        </Popover>
      </span>
    );
  },
});
