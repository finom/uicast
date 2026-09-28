import { createComponentImplementation } from "@uicast/react";
import { iconNode } from "../../lib/icon-node";
import { StackSkeleton } from "../../lib/skeletons";
import { cn } from "../../lib/utils";
import { TimelineDef } from "./def";

const DOT_COLORS = {
  default: "bg-primary text-primary-foreground",
  success: "bg-success text-white",
  warning: "bg-warning text-white",
  destructive: "bg-destructive text-white",
};

export const TimelineImpl = createComponentImplementation({
  def: TimelineDef,
  render: ({ items, onItemClick }, { entry }) => (
    <div data-key={entry.key}>
      {items.map((item, i) => (
        <div
          key={i}
          className={cn("flex gap-4", entry.callbacks?.onItemClick && "cursor-pointer")}
          onClick={() => onItemClick({ index: i, title: item.title })}
        >
          <div className="flex flex-col items-center">
            <div
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full",
                DOT_COLORS[item.variant ?? "default"],
              )}
            >
              {iconNode(item.icon, "size-3") ?? <div className="size-2 rounded-full bg-current" />}
            </div>
            {i < items.length - 1 && <div className="w-0.5 flex-1 bg-border" />}
          </div>
          {/* The gap to the next item is padding here, so the line beside it spans the gap. */}
          <div className={cn("flex-1", i < items.length - 1 && "pb-8")}>
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">{item.title}</p>
              {item.time && <span className="text-xs text-muted-foreground whitespace-nowrap">{item.time}</span>}
            </div>
            {item.description && <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>}
          </div>
        </div>
      ))}
    </div>
  ),
  skeleton: StackSkeleton,
});
