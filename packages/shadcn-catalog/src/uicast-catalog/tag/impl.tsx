import { createComponentImplementation } from "@uicast/react";
import { pickMouseEvent } from "../../events/mouse";
import { X } from "lucide-react";
import { Badge } from "../../components/ui/badge";
import { TagDef } from "./def";

export const TagImpl = createComponentImplementation({
  def: TagDef,
  render: ({ text, children, variant, removable, onClick, onRemove }, { entry }) => (
    <Badge
      variant={variant}
      className="gap-1 cursor-pointer"
      onClick={(e) => onClick(pickMouseEvent(e))}
      data-key={entry.key}
    >
      {children ?? text}
      {removable && (
        <button
          type="button"
          className="ml-0.5 rounded-full outline-none hover:bg-foreground/20 p-0.5"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          <X className="size-3" />
        </button>
      )}
    </Badge>
  ),
});
