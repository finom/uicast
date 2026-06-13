import { createComponentImplementation } from "@ui-fired/react";
import { pickClick } from "@ui-fired/catalog/render/shared";
import { GridDef } from "./def";

export const GridImpl = createComponentImplementation({
  def: GridDef,
  render: ({ columns = "3", gap = "4", children, onClick, generatedKey }) => {
    const colsMap: Record<string, string> = {
      "1": "grid-cols-1",
      "2": "grid-cols-2",
      "3": "grid-cols-3",
      "4": "grid-cols-4",
      "5": "grid-cols-5",
      "6": "grid-cols-6",
    };
    return (
      <div
        className={`grid ${colsMap[columns]} gap-${gap}`}
        onClick={(e) => onClick?.(pickClick(e))}
        data-key={generatedKey}
      >
        {children}
      </div>
    );
  },
});
