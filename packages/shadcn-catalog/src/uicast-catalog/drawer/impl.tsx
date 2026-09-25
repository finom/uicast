import { createComponentImplementation } from "@uicast/react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "../../components/ui/sheet";
import { PanelSkeleton } from "../../lib/skeletons";
import { DrawerDef } from "./def";

export const DrawerImpl = createComponentImplementation({
  def: DrawerDef,
  render: ({ open, title, description, side, children, onOpenChange }, { entry }) => (
    <span data-key={entry.key}>
      <Sheet open={open} onOpenChange={(v) => onOpenChange({ open: v })}>
        <SheetContent side={side}>
          {(title || description) && (
            <SheetHeader>
              {title && <SheetTitle>{title}</SheetTitle>}
              {description && <SheetDescription>{description}</SheetDescription>}
            </SheetHeader>
          )}
          <div className="flex-1 overflow-y-auto p-4">{children}</div>
        </SheetContent>
      </Sheet>
    </span>
  ),
  skeleton: PanelSkeleton,
});
