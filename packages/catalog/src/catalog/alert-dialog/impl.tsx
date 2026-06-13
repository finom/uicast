import { createComponentImplementation } from "@ui-fired/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@ui-fired/catalog/components/ui/dialog";
import { Button } from "@ui-fired/catalog/components/ui/button";
import { AlertDialogDef } from "./def";

export const AlertDialogImpl = createComponentImplementation({
  def: AlertDialogDef,
  render: ({
    open = false,
    title,
    description,
    actionLabel = "OK",
    variant = "default",
    onAction,
    generatedKey,
  }) => {
    return (
      <Dialog open={open} data-key={generatedKey}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && (
              <DialogDescription>{description}</DialogDescription>
            )}
          </DialogHeader>
          <DialogFooter>
            <Button
              variant={variant === "destructive" ? "destructive" : "default"}
              onClick={() => onAction?.({})}
            >
              {actionLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  },
});
