import { createComponentImplementation } from "@uicast/react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "../../components/ui/sheet";
import { PanelSkeleton } from "../../lib/skeletons";
import { ModalDef } from "./def";

export const ModalImpl = createComponentImplementation({
  def: ModalDef,
  render: ({ open, title, description, side, children, onOpenChange }, { entry }) => (
    <span data-key={entry.key}>
      {side ? (
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
      ) : (
        <Dialog open={open} onOpenChange={(v) => onOpenChange({ open: v })}>
          <DialogContent>
            {(title || description) && (
              <DialogHeader>
                {title && <DialogTitle>{title}</DialogTitle>}
                {description && <DialogDescription>{description}</DialogDescription>}
              </DialogHeader>
            )}
            {children}
          </DialogContent>
        </Dialog>
      )}
    </span>
  ),
  skeleton: PanelSkeleton,
});
