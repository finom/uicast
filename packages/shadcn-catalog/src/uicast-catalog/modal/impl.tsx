import { createComponentImplementation } from "@uicast/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../../components/ui/dialog";
import { PanelSkeleton } from "../../lib/skeletons";
import { ModalDef } from "./def";

export const ModalImpl = createComponentImplementation({
  def: ModalDef,
  render: ({ open, title, description, children, onOpenChange }, { entry }) => (
    <span data-key={entry.key}>
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
    </span>
  ),
  skeleton: PanelSkeleton,
});
