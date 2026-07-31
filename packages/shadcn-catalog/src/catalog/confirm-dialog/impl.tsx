import { createComponentImplementation } from "@uicast/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { ConfirmDialogDef } from "./def";

export const ConfirmDialogImpl = createComponentImplementation({
  def: ConfirmDialogDef,
  render: ({
    open = false,
    title = "Are you sure?",
    description,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    variant = "default",
    onConfirm,
    onCancel,
    generatedKey,
  }) => {
    return (
      <span data-key={generatedKey}>
        <Dialog open={open} onOpenChange={(v) => !v && onCancel?.({})}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
              {description && (
                <DialogDescription>{description}</DialogDescription>
              )}
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => onCancel?.({})}>
                {cancelLabel}
              </Button>
              <Button variant={variant} onClick={() => onConfirm?.({})}>
                {confirmLabel}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </span>
    );
  },
});
