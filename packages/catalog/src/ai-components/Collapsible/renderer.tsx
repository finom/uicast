import { createAIComponentRenderer } from "@ui-fired/core/render/createAIComponentRenderer";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@ui-fired/catalog/components/ui/collapsible";
import { Button } from "@ui-fired/catalog/components/ui/button";
import { ChevronsUpDown } from "lucide-react";
import { CollapsibleDef } from "./def";

export const CollapsibleRenderer = createAIComponentRenderer({
  def: CollapsibleDef,
  renderer: ({ open = false, title, children, onOpenChange, generatedKey }) => {
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
