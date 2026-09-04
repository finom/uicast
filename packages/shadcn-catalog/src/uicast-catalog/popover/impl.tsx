import { createComponentImplementation, type PlaceholderComponentProps } from "@uicast/react";
import { Skeleton } from "../../components/ui/skeleton";
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
    open,
    triggerLabel,
    side,
    children,
    onOpenChange,
  }, { entry }) => {
    return (
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
    );
  },
  placeholder: ({ children }: PlaceholderComponentProps) => (
    <div className="flex flex-col gap-3 rounded-lg border p-4">
      <Skeleton className="h-4 w-40" />
      {children}
    </div>
  ),
});
