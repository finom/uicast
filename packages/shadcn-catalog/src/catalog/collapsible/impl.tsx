import { createComponentImplementation } from "@ui-fired/react";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "../../components/ui/collapsible";
import { Button } from "../../components/ui/button";
import { ChevronsUpDown } from "lucide-react";
import { CollapsibleDef } from "./def";

export const CollapsibleImpl = createComponentImplementation({
  def: CollapsibleDef,
  render: ({ open = false, title, children, onOpenChange, generatedKey }) => {
    return (
      <Collapsible
        open={open}
        onOpenChange={(isOpen) => onOpenChange?.({ open: isOpen })}
        data-key={generatedKey}
      >
        <div className="flex items-center justify-between space-x-4">
          <h4 className="text-sm font-semibold">{title}</h4>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm">
              <ChevronsUpDown className="h-4 w-4" />
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent className="mt-2 space-y-2">
          {children}
        </CollapsibleContent>
      </Collapsible>
    );
  },
});
