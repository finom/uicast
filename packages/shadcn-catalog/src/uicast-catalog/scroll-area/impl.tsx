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
  }, { entry }) => {
    return (
      <ScrollArea style={{ height, width }} data-key={entry.key}>
        {children}
        {(orientation === "horizontal" || orientation === "both") && (
          <ScrollBar orientation="horizontal" />
        )}
      </ScrollArea>
    );
  },
});
