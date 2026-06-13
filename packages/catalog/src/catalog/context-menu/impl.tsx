import { createComponentImplementation } from "@ui-fired/react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@ui-fired/catalog/components/ui/context-menu";
import { ContextMenuDef } from "./def";

export const ContextMenuImpl = createComponentImplementation({
  def: ContextMenuDef,
  render: ({ items = [], children, onAction, generatedKey }) => {
    return (
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div data-key={generatedKey}>{children}</div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          {items.map((item, i) => (
            <span key={i}>
              {item.separator && <ContextMenuSeparator />}
              <ContextMenuItem
                disabled={item.disabled}
                variant={
                  item.variant === "destructive" ? "destructive" : "default"
                }
                onClick={() => onAction?.({ label: item.label, index: i })}
              >
                {item.label}
                {item.shortcut && (
                  <ContextMenuShortcut>{item.shortcut}</ContextMenuShortcut>
                )}
              </ContextMenuItem>
            </span>
          ))}
        </ContextMenuContent>
      </ContextMenu>
    );
  },
});
