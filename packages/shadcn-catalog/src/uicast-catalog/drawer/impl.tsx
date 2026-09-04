import { createComponentImplementation, type PlaceholderComponentProps } from "@uicast/react";
import { Skeleton } from "../../components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "../../components/ui/sheet";
import { DrawerDef } from "./def";

export const DrawerImpl = createComponentImplementation({
  def: DrawerDef,
  render: ({
    open,
    title,
    description,
    side,
    children,
    onOpenChange,
  }, { entry }) => {
    return (
      <span data-key={entry.key}>
        <Sheet open={open} onOpenChange={(v) => onOpenChange({ open: v })}>
          <SheetContent side={side}>
            {(title || description) && (
              <SheetHeader>
                {title && <SheetTitle>{title}</SheetTitle>}
                {description && (
                  <SheetDescription>{description}</SheetDescription>
                )}
              </SheetHeader>
            )}
            <div className="flex-1 overflow-y-auto p-4">{children}</div>
          </SheetContent>
        </Sheet>
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
