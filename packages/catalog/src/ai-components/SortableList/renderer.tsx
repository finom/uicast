import { createAIComponentRenderer } from "ui-fired/core/render/createAIComponentRenderer";
import { GripVertical } from "lucide-react";
import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { SortableListDef } from "./def";

export const SortableListRenderer = createAIComponentRenderer({
  def: SortableListDef,
  renderer: ({ items = [], showIndex = true, onItemClick, generatedKey }) => {
    const getIcon = (iconName?: string) => {
      if (!iconName) return null;
      const Icon = (LucideIcons as unknown as Record<string, LucideIcon>)[
        iconName
      ];
      return Icon ? <Icon className="h-4 w-4 shrink-0" /> : null;
    };

    return (
      <div className="space-y-1" data-key={generatedKey}>
        {items.map((item, i) => (
          <div
            key={item.id}
            className="flex items-center gap-2 rounded-md border bg-background px-3 py-2 hover:bg-accent cursor-pointer transition-colors"
            onClick={() => onItemClick?.({ id: item.id, index: i })}
          >
            <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground cursor-grab" />
            {showIndex && (
              <span className="w-6 text-center text-xs font-medium text-muted-foreground">
                {i + 1}
              </span>
            )}
            {getIcon(item.icon)}
            <span className="text-sm">{item.label}</span>
          </div>
        ))}
      </div>
    );
  },
});
