import { createComponentImplementation } from "@uicast/react";
import { iconNode } from "../../lib/icon-node";
import { StackSkeleton } from "../../lib/skeletons";
import { cn } from "../../lib/utils";
import { TimelineDef } from "./def";

const DOT_COLORS = {
  default: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  destructive: "bg-destructive",
};

export const TimelineImpl = createComponentImplementation({
  def: TimelineDef,
  render: ({ items, onItemClick }, { entry }) => (
    <div data-key={entry.key}>
      {items.map((item, i) => (
        <div
          key={i}
          className="relative flex gap-4 pb-8 last:pb-0 cursor-pointer"
          onClick={() => onItemClick({ index: i, title: item.title })}
        >
          <div className="flex flex-col items-center">
            <div
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full text-white",
                DOT_COLORS[item.variant ?? "default"],
              )}
            >
              {iconNode(item.icon, "size-3") ?? <div className="size-2 rounded-full bg-white" />}
            </div>
            {i < items.length - 1 && <div className="w-px flex-1 bg-border" />}
          </div>
          <div className="flex-1 pb-2">
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
