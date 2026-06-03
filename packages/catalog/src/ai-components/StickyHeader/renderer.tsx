import { createAIComponentRenderer } from "@ui-fired/react";
import { cn } from "@ui-fired/core/lib/utils";
import { StickyHeaderDef } from "./def";

export const StickyHeaderRenderer = createAIComponentRenderer({
  def: StickyHeaderDef,
  renderer: ({
    zIndex = 10,
    bordered = true,
    blurred = true,
    children,
    generatedKey,
  }) => {
    return (
      <div
        className={cn(
          "sticky top-0 bg-background/95 px-4 py-3",
          bordered && "border-b",
          blurred &&
            "backdrop-blur supports-[backdrop-filter]:bg-background/60",
        )}
        style={{ zIndex }}
        data-key={generatedKey}
      >
        {children}
      </div>
    );
  },
});
