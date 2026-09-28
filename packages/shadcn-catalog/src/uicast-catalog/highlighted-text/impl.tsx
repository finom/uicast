import { createComponentImplementation } from "@uicast/react";
import { HighlightedTextDef } from "./def";

const BACKGROUNDS = {
  yellow: "bg-warning/30",
  green: "bg-success/30",
  blue: "bg-info/30",
  red: "bg-destructive/30",
} as const;

export const HighlightedTextImpl = createComponentImplementation({
  def: HighlightedTextDef,
  render: ({ text, highlight, color, caseSensitive }, { entry }) => {
    if (!highlight) {
      return <span data-key={entry.key}>{text}</span>;
    }

    const flags = caseSensitive ? "g" : "gi";
    const escapedHighlight = highlight.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escapedHighlight})`, flags);
    const parts = text.split(regex);

    return (
      <span data-key={entry.key}>
        {parts.map((part, i) => {
          const isMatch = caseSensitive ? part === highlight : part.toLowerCase() === highlight.toLowerCase();
          return isMatch ? (
            <mark key={i} className={`${BACKGROUNDS[color]} rounded-sm px-0.5 text-inherit`}>
              {part}
            </mark>
          ) : (
            <span key={i}>{part}</span>
          );
        })}
      </span>
    );
  },
});
