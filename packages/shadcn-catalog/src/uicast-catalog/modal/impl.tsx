import { createComponentImplementation, type PlaceholderComponentProps } from "@uicast/react";
import { Skeleton } from "../../components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../components/ui/dialog";
import { ModalDef } from "./def";

export const ModalImpl = createComponentImplementation({
  def: ModalDef,
  render: ({
    open,
    title,
    description,
    children,
    onOpenChange,
  }, { entry }) => {
    return (
      <span data-key={entry.key}>
        <Dialog open={open} onOpenChange={(v) => onOpenChange({ open: v })}>
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
  placeholder: ({ children }: PlaceholderComponentProps) => (
    <div className="flex flex-col gap-3 rounded-lg border p-4">
      <Skeleton className="h-4 w-40" />
      {children}
    </div>
  ),
});
