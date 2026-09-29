import { createComponentImplementation } from "@uicast/react";
import { useLayoutEffect, useRef, useState } from "react";
import { Button } from "../../components/ui/button";
import { TruncatedTextDef } from "./def";

export const TruncatedTextImpl = createComponentImplementation({
  def: TruncatedTextDef,
  render: ({ text, maxLines, expandable, onToggle }, { entry }) => {
    const [expanded, setExpanded] = useState(false);
    const [clamped, setClamped] = useState(false);
    const ref = useRef<HTMLParagraphElement>(null);

    // The toggle shows only when the clamp hides text. Measured again when the width changes.
    // biome-ignore lint/correctness/useExhaustiveDependencies: new text or maxLines can change the overflow without resizing the box
    useLayoutEffect(() => {
      const el = ref.current;
      if (!el || expanded) return;
      const measure = () => setClamped(el.scrollHeight > el.clientHeight + 1);
      measure();
      const observer = new ResizeObserver(measure);
      observer.observe(el);
      return () => observer.disconnect();
    }, [text, maxLines, expanded]);

    return (
      <div data-key={entry.key}>
        <p
          ref={ref}
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
        {expandable && (clamped || expanded) && (
          <Button
            type="button"
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
