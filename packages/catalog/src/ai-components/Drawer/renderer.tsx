import { createAIComponentRenderer } from "@ui-fired/react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@ui-fired/catalog/components/ui/sheet";
import { DrawerDef } from "./def";

export const DrawerRenderer = createAIComponentRenderer({
  def: DrawerDef,
  renderer: ({
    open = false,
    title,
    description,
    side = "right",
    children,
    onOpenChange,
    generatedKey,
  }) => {
    return (
      <span data-key={generatedKey}>
        <Sheet open={open} onOpenChange={(v) => onOpenChange?.({ open: v })}>
          <SheetContent side={side}>
            {(title || description) && (
              <SheetHeader>
                {title && <SheetTitle>{title}</SheetTitle>}
                {description && (
                  <SheetDescription>{description}</SheetDescription>
                )}
              </SheetHeader>
            )}
            <div className="flex-1 overflow-y-auto p-4">{children}</div>
          </SheetContent>
        </Sheet>
      </span>
    );
  },
});
