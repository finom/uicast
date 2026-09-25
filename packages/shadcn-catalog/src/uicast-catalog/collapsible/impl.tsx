import { createComponentImplementation } from "@uicast/react";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "../../components/ui/collapsible";
import { Button } from "../../components/ui/button";
import { ChevronsUpDown } from "lucide-react";
import { StackSkeleton } from "../../lib/skeletons";
import { CollapsibleDef } from "./def";

export const CollapsibleImpl = createComponentImplementation({
  def: CollapsibleDef,
  render: ({ open, title, children, onOpenChange }, { entry }) => (
    <Collapsible open={open} onOpenChange={(isOpen) => onOpenChange({ open: isOpen })} data-key={entry.key}>
      <div className="flex items-center justify-between space-x-4">
        <h4 className="text-sm font-semibold">{title}</h4>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm">
            <ChevronsUpDown className="size-4" />
          </Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className="mt-2 space-y-2">{children}</CollapsibleContent>
    </Collapsible>
  ),
  skeleton: StackSkeleton,
});
