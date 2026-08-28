import { createComponentImplementation } from "@uicast/react";
import { HighlightDef } from "./def";

const colorMap: Record<string, string> = {
  yellow: "bg-yellow-200 dark:bg-yellow-800/50",
  green: "bg-green-200 dark:bg-green-800/50",
  blue: "bg-blue-200 dark:bg-blue-800/50",
  red: "bg-red-200 dark:bg-red-800/50",
};

export const HighlightImpl = createComponentImplementation({
  def: HighlightDef,
  render: ({
    text,
    highlight,
    color = "yellow",
    caseSensitive = false,
    generatedKey,
  }) => {
    if (!highlight) {
      return <span data-key={generatedKey}>{text}</span>;
    }

    const flags = caseSensitive ? "g" : "gi";
    const escapedHighlight = highlight.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escapedHighlight})`, flags);
    const parts = text.split(regex);

    // A named color resolves through the map; anything else is treated as a
    // raw CSS color via inline style (a runtime-built Tailwind class like
    // `bg-${color}-200` is never compiled, so it can't work).
    const bgClass = colorMap[color];

    return (
      <span data-key={generatedKey}>
        {parts.map((part, i) => {
          const isMatch = caseSensitive
            ? part === highlight
            : part.toLowerCase() === highlight.toLowerCase();
          return isMatch ? (
            <mark
              key={i}
              className={`${bgClass ?? ""} px-0.5 rounded-sm`}
              style={bgClass ? undefined : { backgroundColor: color }}
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
