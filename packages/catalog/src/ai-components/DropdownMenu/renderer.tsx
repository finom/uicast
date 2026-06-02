import { createAIComponentRenderer } from "@ui-fired/core/render/createAIComponentRenderer";
import {
  DropdownMenu as ShadcnDropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@ui-fired/catalog/components/ui/dropdown-menu";
import { Button } from "@ui-fired/catalog/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { DropdownMenuDef } from "./def";

export const DropdownMenuRenderer = createAIComponentRenderer({
  def: DropdownMenuDef,
  renderer: ({ triggerLabel, children, generatedKey }) => {
    return (
      <span data-key={generatedKey}>
        <ShadcnDropdownMenu>
          <DropdownMenuTrigger asChild>
            {triggerLabel ? (
              <Button variant="outline">{triggerLabel}</Button>
            ) : (
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="size-4" />
              </Button>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">{children}</DropdownMenuContent>
        </ShadcnDropdownMenu>
      </span>
    );
  },
});
