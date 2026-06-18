import { createComponentImplementation } from "@ui-fired/react";
import {
  DropdownMenu as ShadcnDropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { Button } from "../../components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { DropdownMenuDef } from "./def";

export const DropdownMenuImpl = createComponentImplementation({
  def: DropdownMenuDef,
  render: ({ triggerLabel, children, generatedKey }) => {
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
