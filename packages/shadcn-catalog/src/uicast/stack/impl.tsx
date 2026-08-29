import { createComponentImplementation } from "@uicast/react";
import { pickMouseEvent } from "../../events/mouse";
import { StackDef } from "./def";

export const StackImpl = createComponentImplementation({
  def: StackDef,
  render: ({
    direction,
    gap,
    align,
    children,
    onClick,
    generatedKey,
  }) => {
    const dirClass = direction === "horizontal" ? "flex-row" : "flex-col";
    // Static map: Tailwind only compiles class names that appear literally in
    // source — a runtime-built `gap-${gap}` never generates CSS.
    const gapMap: Record<string, string> = {
      "0": "gap-0",
      "1": "gap-1",
      "2": "gap-2",
      "3": "gap-3",
      "4": "gap-4",
      "6": "gap-6",
      "8": "gap-8",
    };
    const alignMap: Record<string, string> = {
      start: "items-start",
      center: "items-center",
      end: "items-end",
      stretch: "items-stretch",
    };
    return (
      <div
        className={`flex ${dirClass} ${gapMap[gap]} ${alignMap[align]}`}
        onClick={(e) => onClick(pickMouseEvent(e))}
        data-key={generatedKey}
      >
        {children}
      </div>
    );
  },
});
