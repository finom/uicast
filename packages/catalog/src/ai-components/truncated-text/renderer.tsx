import { createAIComponentRenderer } from "@ui-fired/react";
import { useState } from "react";
import { cn } from "@ui-fired/core/lib/utils";
import { Button } from "@ui-fired/catalog/components/ui/button";
import { TruncatedTextDef } from "./def";

export const TruncatedTextRenderer = createAIComponentRenderer({
  def: TruncatedTextDef,
  renderer: ({
    text,
    maxLines = 2,
    expandable = true,
    onToggle,
    generatedKey,
  }) => {
    const [expanded, setExpanded] = useState(false);

    return (
      <div data-key={generatedKey}>
        <p
          className={cn("text-sm", !expanded && "overflow-hidden")}
          style={
            expanded
              ? undefined
              : {
                  display: "-webkit-box",
                  WebkitLineClamp: maxLines,
                  WebkitBoxOrient: "vertical" as const,
                  overflow: "hidden",
                }
          }
        >
          {text}
        </p>
        {expandable && (
          <Button
            variant="link"
            size="sm"
            className="mt-1 h-auto p-0 text-xs font-medium"
            onClick={() => {
              setExpanded((prev) => !prev);
              onToggle?.({ expanded: !expanded });
            }}
          >
            {expanded ? "Show less" : "Show more"}
          </Button>
        )}
      </div>
    );
  },
});
