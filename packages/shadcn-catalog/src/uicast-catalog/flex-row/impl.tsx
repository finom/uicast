import { createComponentImplementation } from "@uicast/react";
import { ALIGN, GAP, JUSTIFY } from "../../lib/layout";
import { pickMouseEvent } from "../../events/mouse";
import { FlexRowDef } from "./def";

export const FlexRowImpl = createComponentImplementation({
  def: FlexRowDef,
  render: ({
    gap,
    align,
    justify,
    wrap,
    equalWidth,
    children,
    onClick,
  }, { entry }) => {
    return (
      <div
        className={`flex flex-row ${GAP[gap]} ${ALIGN[align]} ${JUSTIFY[justify]} ${wrap ? "flex-wrap" : ""} ${equalWidth ? "*:flex-1 *:min-w-0" : ""}`}
        onClick={(e) => onClick(pickMouseEvent(e))}
        data-key={entry.key}
      >
        {children}
      </div>
    );
  },
  skeleton: ({ knownProps, children }) => {
    const { gap, align, justify, wrap, equalWidth } =
      knownProps ?? { gap: "2", align: "center", justify: "start", wrap: false, equalWidth: false };
    return (
      <div
        className={`flex flex-row ${GAP[gap]} ${ALIGN[align]} ${JUSTIFY[justify]} ${wrap ? "flex-wrap" : ""} ${equalWidth ? "*:flex-1 *:min-w-0" : ""}`}
      >
        {children}
      </div>
    );
  },
});
