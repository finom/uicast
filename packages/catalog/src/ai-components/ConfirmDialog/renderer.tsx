import { createAIComponentRenderer } from "@ui-fired/core/render/createAIComponentRenderer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@ui-fired/catalog/components/ui/dialog";
import { Button } from "@ui-fired/catalog/components/ui/button";
import { ConfirmDialogDef } from "./def";

export const ConfirmDialogRenderer = createAIComponentRenderer({
  def: ConfirmDialogDef,
  renderer: ({
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
