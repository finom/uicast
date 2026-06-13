import { createComponentImplementation } from "@ui-fired/react";
import { cn } from "@ui-fired/catalog/lib/utils";
import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { TimelineDef } from "./def";

export const TimelineImpl = createComponentImplementation({
  def: TimelineDef,
  render: ({ items = [], onItemClick, generatedKey }) => {
    const getIcon = (iconName?: string) => {
      if (!iconName) return null;
      const Icon = (LucideIcons as unknown as Record<string, LucideIcon>)[
        iconName
      ];
      return Icon ? <Icon className="h-3 w-3" /> : null;
    };

    const dotColors = {
      default: "bg-primary",
      success: "bg-green-500",
      warning: "bg-yellow-500",
      destructive: "bg-destructive",
    };

    return (
      <div className="space-y-0" data-key={generatedKey}>
        {items.map((item, i) => (
          <div
            key={i}
            className="relative flex gap-4 pb-8 last:pb-0 cursor-pointer"
            onClick={() => onItemClick?.({ index: i, title: item.title })}
          >
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white",
                  dotColors[item.variant ?? "default"],
                )}
              >
                {getIcon(item.icon) ?? (
                  <div className="h-2 w-2 rounded-full bg-white" />
                )}
              </div>
              {i < items.length - 1 && (
                <div className="w-px flex-1 bg-border" />
              )}
            </div>
            <div className="flex-1 pb-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">{item.title}</p>
                {item.time && (
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {item.time}
                  </span>
                )}
              </div>
              {item.description && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {item.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  },
});
