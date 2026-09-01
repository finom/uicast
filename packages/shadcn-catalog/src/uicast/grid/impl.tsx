import { createComponentImplementation } from "@uicast/react";
import { pickMouseEvent } from "../../events/mouse";
import { GridDef } from "./def";

export const GridImpl = createComponentImplementation({
  def: GridDef,
  render: ({ columns, gap, children, onClick, generatedKey }) => {
    // Responsive: stacks on phones, declared column count from sm/md up.
    const colsMap: Record<string, string> = {
      "1": "grid-cols-1",
      "2": "grid-cols-1 sm:grid-cols-2",
      "3": "grid-cols-1 sm:grid-cols-2 md:grid-cols-3",
      "4": "grid-cols-2 md:grid-cols-4",
      "5": "grid-cols-2 md:grid-cols-5",
      "6": "grid-cols-2 md:grid-cols-3 lg:grid-cols-6",
    };
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
    return (
      <div
        className={`grid ${colsMap[columns]} ${gapMap[gap]}`}
        onClick={(e) => onClick(pickMouseEvent(e))}
        data-key={generatedKey}
      >
        {children}
      </div>
    );
  },
});
