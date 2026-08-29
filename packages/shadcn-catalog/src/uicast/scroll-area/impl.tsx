import { createComponentImplementation } from "@uicast/react";
import { ScrollArea, ScrollBar } from "../../components/ui/scroll-area";
import { ScrollAreaDef } from "./def";

export const ScrollAreaImpl = createComponentImplementation({
  def: ScrollAreaDef,
  render: ({
    height,
    width,
    orientation,
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
