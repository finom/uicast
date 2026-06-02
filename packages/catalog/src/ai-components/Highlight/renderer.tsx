import { createAIComponentRenderer } from "@ui-fired/core/render/createAIComponentRenderer";
import { HighlightDef } from "./def";

const colorMap: Record<string, string> = {
  yellow: "bg-yellow-200 dark:bg-yellow-800/50",
  green: "bg-green-200 dark:bg-green-800/50",
  blue: "bg-blue-200 dark:bg-blue-800/50",
  red: "bg-red-200 dark:bg-red-800/50",
};

export const HighlightRenderer = createAIComponentRenderer({
  def: HighlightDef,
  renderer: ({
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

    const bgClass = colorMap[color] ?? `bg-${color}-200`;

    return (
      <span data-key={generatedKey}>
        {parts.map((part, i) => {
          const isMatch = caseSensitive
            ? part === highlight
            : part.toLowerCase() === highlight.toLowerCase();
          return isMatch ? (
            <mark key={i} className={`${bgClass} px-0.5 rounded-sm`}>
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
