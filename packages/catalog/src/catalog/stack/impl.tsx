import { createComponentImplementation } from "@ui-fired/react";
import { pickClick } from "@ui-fired/catalog/render/shared";
import { StackDef } from "./def";

export const StackImpl = createComponentImplementation({
  def: StackDef,
  render: ({
    direction = "vertical",
    gap = "2",
    align = "stretch",
    children,
    onClick,
    generatedKey,
  }) => {
    const dirClass = direction === "horizontal" ? "flex-row" : "flex-col";
    const alignMap: Record<string, string> = {
      start: "items-start",
      center: "items-center",
      end: "items-end",
      stretch: "items-stretch",
    };
    return (
      <div
        className={`flex ${dirClass} gap-${gap} ${alignMap[align]}`}
        onClick={(e) => onClick?.(pickClick(e))}
        data-key={generatedKey}
      >
        {children}
      </div>
    );
  },
});
