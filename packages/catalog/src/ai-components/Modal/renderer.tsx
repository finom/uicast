import { createAIComponentRenderer } from "@ui-fired/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@ui-fired/catalog/components/ui/dialog";
import { ModalDef } from "./def";

export const ModalRenderer = createAIComponentRenderer({
  def: ModalDef,
  renderer: ({
    open = false,
    title,
    description,
    children,
    onOpenChange,
    generatedKey,
  }) => {
    return (
      <span data-key={generatedKey}>
        <Dialog open={open} onOpenChange={(v) => onOpenChange?.({ open: v })}>
          <DialogContent>
            {(title || description) && (
              <DialogHeader>
                {title && <DialogTitle>{title}</DialogTitle>}
                {description && (
                  <DialogDescription>{description}</DialogDescription>
                )}
              </DialogHeader>
            )}
            {children}
          </DialogContent>
        </Dialog>
      </span>
    );
  },
});
