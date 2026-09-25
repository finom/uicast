import { createComponentImplementation } from "@uicast/react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../components/ui/popover";
import { Button } from "../../components/ui/button";
import { PanelSkeleton } from "../../lib/skeletons";
import { PopoverDef } from "./def";

export const PopoverImpl = createComponentImplementation({
  def: PopoverDef,
  render: ({ open, triggerLabel, side, children, onOpenChange }, { entry }) => (
    <span data-key={entry.key}>
      <Popover open={open} onOpenChange={(v) => onOpenChange({ open: v })}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">
            {triggerLabel ?? "More"}
          </Button>
        </PopoverTrigger>
        <PopoverContent side={side} className="w-auto min-w-50">
          {children}
        </PopoverContent>
      </Popover>
    </span>
  ),
  skeleton: PanelSkeleton,
});
