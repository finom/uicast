import { createComponentImplementation } from "@ui-fired/react";
import { pickMouseEvent } from "../../events/mouse";
import { FlexRowDef } from "./def";

export const FlexRowImpl = createComponentImplementation({
  def: FlexRowDef,
  render: ({
    gap = "2",
    align = "center",
    justify = "start",
    wrap = false,
    equalWidth = false,
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
      baseline: "items-baseline",
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
        className={`flex flex-row ${gapClass} ${alignMap[align]} ${justifyMap[justify]} ${wrap ? "flex-wrap" : ""} ${equalWidth ? "[&>*]:flex-1 [&>*]:min-w-0" : ""}`}
        onClick={(e) => onClick?.(pickMouseEvent(e))}
        data-key={generatedKey}
      >
        {children}
      </div>
    );
  },
});
