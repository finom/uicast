import { createComponentImplementation } from "@uicast/react";
import { HighlightedTextDef } from "./def";

const BACKGROUNDS = {
  yellow: "bg-yellow-200 dark:bg-yellow-800/50",
  green: "bg-green-200 dark:bg-green-800/50",
  blue: "bg-blue-200 dark:bg-blue-800/50",
  red: "bg-red-200 dark:bg-red-800/50",
} as const;

export const HighlightedTextImpl = createComponentImplementation({
  def: HighlightedTextDef,
  render: ({
    text,
    highlight,
    color,
    caseSensitive,
  }, { entry }) => {
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
          const isMatch = caseSensitive
            ? part === highlight
            : part.toLowerCase() === highlight.toLowerCase();
          return isMatch ? (
            <mark
              key={i}
              className={`${BACKGROUNDS[color]} px-0.5 rounded-sm`}
            >
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
