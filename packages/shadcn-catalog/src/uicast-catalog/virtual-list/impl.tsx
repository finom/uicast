import { createComponentImplementation } from "@uicast/react";
import { useState } from "react";
import { blockSkeleton } from "../../lib/skeletons";
import { cn } from "../../lib/utils";
import { VirtualListDef } from "./def";

const OVERSCAN = 1;

export const VirtualListImpl = createComponentImplementation({
  def: VirtualListDef,
  render: ({ items, height, itemHeight, onItemClick }, { entry }) => {
    const [scrollTop, setScrollTop] = useState(0);

    const totalHeight = items.length * itemHeight;
    const visibleCount = Math.ceil(height / itemHeight) + 2 * OVERSCAN;
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - OVERSCAN);
    const endIndex = Math.min(items.length, startIndex + visibleCount);
    const visibleItems = items.slice(startIndex, endIndex);

    return (
      <div
        onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
        className="overflow-auto rounded-md border"
        style={{ height }}
        data-key={entry.key}
      >
        <div style={{ height: totalHeight, position: "relative" }}>
          {visibleItems.map((item, i) => {
            const actualIndex = startIndex + i;
            return (
              <div
                key={item.id}
                className={cn(
                  "absolute inset-x-0 flex flex-col justify-center px-4 border-b",
                  entry.callbacks?.onItemClick && "cursor-pointer hover:bg-accent",
                )}
                style={{
                  top: actualIndex * itemHeight,
                  height: itemHeight,
                }}
                onClick={() => onItemClick({ id: item.id, index: actualIndex })}
              >
                <span className="text-sm">{item.primary}</span>
                {item.secondary && <span className="text-xs text-muted-foreground">{item.secondary}</span>}
              </div>
            );
          })}
        </div>
      </div>
    );
  },
  skeleton: blockSkeleton(320),
});
