import { createComponentImplementation } from "@uicast/react";
import { ScrollArea as ScrollAreaPrimitive } from "radix-ui";
import { ScrollBar } from "../../components/ui/scroll-area";
import { ScrollAreaDef } from "./def";

// Built from the parts: the vendored ScrollArea always mounts a vertical bar, and Radix scrolls only where a bar is.
export const ScrollAreaImpl = createComponentImplementation({
  def: ScrollAreaDef,
  render: ({ height, width, orientation, children }, { entry }) => (
    <ScrollAreaPrimitive.Root
      data-slot="scroll-area"
      className="relative"
      style={{ height, width }}
      data-key={entry.key}
    >
      <ScrollAreaPrimitive.Viewport
        data-slot="scroll-area-viewport"
        tabIndex={0}
        className="size-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1"
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      {orientation !== "horizontal" && <ScrollBar />}
      {orientation !== "vertical" && <ScrollBar orientation="horizontal" />}
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  ),
});
