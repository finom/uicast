import { createComponentImplementation } from "@uicast/react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "../../components/ui/context-menu";
import { ContextMenuDef } from "./def";

export const ContextMenuImpl = createComponentImplementation({
  def: ContextMenuDef,
  render: ({ items = [], children, onAction}, { entry }) => {
    return (
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div data-key={entry.key}>{children}</div>
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
                onClick={() => onAction({ label: item.label, index: i })}
              >
                {item.label}
                {item.shortcut?.length ? (
                  <ContextMenuShortcut>{item.shortcut.join("+")}</ContextMenuShortcut>
                ) : null}
              </ContextMenuItem>
            </span>
          ))}
        </ContextMenuContent>
      </ContextMenu>
    );
  },
});
