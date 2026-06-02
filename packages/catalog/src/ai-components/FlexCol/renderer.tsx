import { createAIComponentRenderer } from "ui-fired/core/render/createAIComponentRenderer";
import { pickClick } from "ui-fired/core/render/shared";
import { FlexColDef } from "./def";

export const FlexColRenderer = createAIComponentRenderer({
  def: FlexColDef,
  renderer: ({
    gap = "2",
    align = "stretch",
    justify = "start",
    children,
    onClick,
    generatedKey,
  }) => {
    const gapClass = `gap-${gap}`;
    const alignMap: Record<string, string> = {
      start: "items-start",
      center: "items-center",
      end: "items-end",
      stretch: "items-stretch",
    };
    const justifyMap: Record<string, string> = {
      start: "justify-start",
      center: "justify-center",
      end: "justify-end",
      between: "justify-between",
      around: "justify-around",
      evenly: "justify-evenly",
    };
    return (
      <div
        className={`flex flex-col ${gapClass} ${alignMap[align]} ${justifyMap[justify]}`}
        onClick={(e) => onClick?.(pickClick(e))}
        data-key={generatedKey}
      >
        {children}
      </div>
    );
  },
});
