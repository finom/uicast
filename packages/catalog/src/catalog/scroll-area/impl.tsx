import { createComponentImplementation } from "@ui-fired/react";
import { ScrollArea, ScrollBar } from "@ui-fired/catalog/components/ui/scroll-area";
import { ScrollAreaDef } from "./def";

export const ScrollAreaImpl = createComponentImplementation({
  def: ScrollAreaDef,
  render: ({
    height = "300px",
    width,
    orientation = "vertical",
    children,
    generatedKey,
  }) => {
    return (
      <ScrollArea style={{ height, width }} data-key={generatedKey}>
        {children}
        {(orientation === "horizontal" || orientation === "both") && (
          <ScrollBar orientation="horizontal" />
        )}
      </ScrollArea>
    );
  },
});
