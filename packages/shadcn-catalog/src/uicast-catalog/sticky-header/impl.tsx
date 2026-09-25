import { createComponentImplementation } from "@uicast/react";
import { cn } from "../../lib/utils";
import { StickyHeaderDef } from "./def";

export const StickyHeaderImpl = createComponentImplementation({
  def: StickyHeaderDef,
  render: ({ zIndex, bordered, blurred, children }, { entry }) => (
    <div
      className={cn(
        "sticky top-0 bg-background/95 px-4 py-3",
        bordered && "border-b",
        blurred &&
          "backdrop-blur-sm supports-backdrop-filter:bg-background/60",
      )}
      style={{ zIndex }}
      data-key={entry.key}
    >
      {children}
    </div>
  ),
});
