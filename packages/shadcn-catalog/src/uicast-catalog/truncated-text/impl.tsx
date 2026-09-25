import { createComponentImplementation } from "@uicast/react";
import { useState } from "react";
import { Button } from "../../components/ui/button";
import { TruncatedTextDef } from "./def";

export const TruncatedTextImpl = createComponentImplementation({
  def: TruncatedTextDef,
  render: ({ text, maxLines, expandable, onToggle }, { entry }) => {
    const [expanded, setExpanded] = useState(false);

    return (
      <div data-key={entry.key}>
        <p
          className="text-sm"
          style={
            expanded
              ? undefined
              : {
                  display: "-webkit-box",
                  WebkitLineClamp: maxLines,
                  WebkitBoxOrient: "vertical",
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
              onToggle({ expanded: !expanded });
            }}
          >
            {expanded ? "Show less" : "Show more"}
          </Button>
        )}
      </div>
    );
  },
});
