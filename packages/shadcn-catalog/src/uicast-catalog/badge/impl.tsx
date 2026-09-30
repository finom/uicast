import { createComponentImplementation } from "@uicast/react";
import { X } from "lucide-react";
import { Badge as ShadcnBadge } from "../../components/ui/badge";
import { pickMouseEvent } from "../../events/mouse";
import { BadgeDef } from "./def";

export const BadgeImpl = createComponentImplementation({
  def: BadgeDef,
  render: ({ text, children, variant, removable, onClick, onRemove }, { entry }) => (
    <ShadcnBadge
      variant={variant}
      className={entry.callbacks?.onClick ? "cursor-pointer" : undefined}
      onClick={(e) => onClick(pickMouseEvent(e))}
      data-key={entry.key}
    >
      {children ?? text}
      {removable && (
        <button
          type="button"
          className="ml-0.5 rounded-full p-0.5 outline-none hover:bg-foreground/20"
          aria-label="Remove"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          <X className="size-3" />
        </button>
      )}
    </ShadcnBadge>
  ),
});
