import { createAIComponentRenderer } from "@ui-fired/core/render/createAIComponentRenderer";
import { pickClick } from "@ui-fired/core/render/shared";
import { X } from "lucide-react";
import { Badge } from "@ui-fired/catalog/components/ui/badge";
import { TagDef } from "./def";

export const TagRenderer = createAIComponentRenderer({
  def: TagDef,
  renderer: ({
    children,
    variant = "secondary",
    removable = false,
    onClick,
    onRemove,
    generatedKey,
  }) => {
    return (
      <Badge
        variant={variant}
        className="gap-1 cursor-pointer"
        onClick={(e) => onClick?.(pickClick(e))}
        data-key={generatedKey}
      >
        {String(children ?? "")}
        {removable && (
          <button
            type="button"
            className="ml-0.5 rounded-full outline-none hover:bg-foreground/20 p-0.5"
            onClick={(e) => {
              e.stopPropagation();
              onRemove?.({});
            }}
          >
            <X className="size-3" />
          </button>
        )}
      </Badge>
    );
  },
});
