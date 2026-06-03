import { createAIComponentRenderer } from "@ui-fired/react";
import {
  Sheet as ShadcnSheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@ui-fired/catalog/components/ui/sheet";
import { SheetDef } from "./def";

export const SheetRenderer = createAIComponentRenderer({
  def: SheetDef,
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
        <ShadcnSheet
          open={open}
          onOpenChange={(v) => onOpenChange?.({ open: v })}
        >
          <SheetContent side={side}>
            {(title || description) && (
              <SheetHeader>
                {title && <SheetTitle>{title}</SheetTitle>}
                {description && (
                  <SheetDescription>{description}</SheetDescription>
                )}
              </SheetHeader>
            )}
            <div className="flex-1 overflow-y-auto py-4">{children}</div>
          </SheetContent>
        </ShadcnSheet>
      </span>
    );
  },
});
