import { createAIComponentRenderer } from "ui-fired/core/render/createAIComponentRenderer";
import { ScrollArea, ScrollBar } from "ui-fired/catalog/components/ui/scroll-area";
import { ScrollAreaDef } from "./def";

export const ScrollAreaRenderer = createAIComponentRenderer({
  def: ScrollAreaDef,
  renderer: ({
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
