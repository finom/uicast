import { createComponentImplementation, type PlaceholderComponentProps } from "@uicast/react";
import { GripVertical } from "lucide-react";
import { iconNode } from "../../lib/icon-node";
import { SortableListDef } from "./def";

export const SortableListImpl = createComponentImplementation({
  def: SortableListDef,
  render: ({ items = [], showIndex, onItemClick}, { entry }) => {
    return (
      <div className="space-y-1" data-key={entry.key}>
        {items.map((item, i) => (
          <div
            key={item.id}
            className="flex items-center gap-2 rounded-md border bg-background px-3 py-2 hover:bg-accent cursor-pointer transition-colors"
            onClick={() => onItemClick({ id: item.id, index: i })}
          >
            <GripVertical className="size-4 shrink-0 text-muted-foreground cursor-grab" />
            {showIndex && (
              <span className="w-6 text-center text-xs font-medium text-muted-foreground">
                {i + 1}
              </span>
            )}
            {iconNode(item.icon, "size-4 shrink-0")}
            <span className="text-sm">{item.label}</span>
          </div>
        ))}
      </div>
    );
  },
  placeholder: ({ children }: PlaceholderComponentProps) => <div className="flex flex-col gap-2">{children}</div>,
});
