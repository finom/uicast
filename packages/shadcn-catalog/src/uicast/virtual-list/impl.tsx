import { createComponentImplementation } from "@uicast/react";
import { useState, useRef, useEffect, useCallback } from "react";
import { VirtualListDef } from "./def";

export const VirtualListImpl = createComponentImplementation({
  def: VirtualListDef,
  render: ({
    items = [],
    height,
    itemHeight,
    onItemClick,
    generatedKey,
  }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [scrollTop, setScrollTop] = useState(0);

    const totalHeight = items.length * itemHeight;
    const visibleCount = Math.ceil(height / itemHeight) + 2;
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - 1);
    const endIndex = Math.min(items.length, startIndex + visibleCount);
    const visibleItems = items.slice(startIndex, endIndex);

    const handleScroll = useCallback(() => {
      if (containerRef.current) {
        setScrollTop(containerRef.current.scrollTop);
      }
    }, []);

    useEffect(() => {
      const el = containerRef.current;
      if (el) {
        el.addEventListener("scroll", handleScroll, { passive: true });
        return () => el.removeEventListener("scroll", handleScroll);
      }
    }, [handleScroll]);

    return (
      <div
        ref={containerRef}
        className="overflow-auto rounded-md border"
        style={{ height }}
        data-key={generatedKey}
      >
        <div style={{ height: totalHeight, position: "relative" }}>
          {visibleItems.map((item, i) => {
            const actualIndex = startIndex + i;
            return (
              <div
                key={item.id}
                className="absolute inset-x-0 flex flex-col justify-center px-4 border-b hover:bg-accent cursor-pointer"
                style={{
                  top: actualIndex * itemHeight,
                  height: itemHeight,
                }}
                onClick={() =>
                  onItemClick({ id: item.id, index: actualIndex })
                }
              >
                <span className="text-sm">{item.primary}</span>
                {item.secondary && (
                  <span className="text-xs text-muted-foreground">
                    {item.secondary}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  },
});
