import { createComponentImplementation } from "@uicast/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { AlertDialogDef } from "./def";

export const AlertDialogImpl = createComponentImplementation({
  def: AlertDialogDef,
  render: ({
    open,
    title,
    description,
    actionLabel,
    variant,
    onAction,
    generatedKey,
  }) => {
    return (
      <Dialog open={open} data-key={generatedKey}>
        {/* Acknowledge-only dialog: the action button is the sole way out, so
            hide the close X (there is no onOpenChange to wire it to). */}
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && (
              <DialogDescription>{description}</DialogDescription>
            )}
          </DialogHeader>
          <DialogFooter>
            <Button
              variant={variant === "destructive" ? "destructive" : "default"}
              onClick={() => onAction()}
            >
              {actionLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  },
});
