import { createComponentImplementation } from "@uicast/react";
import { ALIGN, GAP, JUSTIFY } from "../../lib/layout";
import { pickMouseEvent } from "../../events/mouse";
import { FlexColDef } from "./def";

export const FlexColImpl = createComponentImplementation({
  def: FlexColDef,
  render: ({
    gap,
    align,
    justify,
    children,
    onClick,
  }, { entry }) => {
    return (
      <div
        className={`flex flex-col ${GAP[gap]} ${ALIGN[align]} ${JUSTIFY[justify]}`}
        onClick={(e) => onClick(pickMouseEvent(e))}
        data-key={entry.key}
      >
        {children}
      </div>
    );
  },
  skeleton: ({ knownProps, children }) => {
    const { gap, align, justify } = knownProps ?? { gap: "2", align: "stretch", justify: "start" };
    return <div className={`flex flex-col ${GAP[gap]} ${ALIGN[align]} ${JUSTIFY[justify]}`}>{children}</div>;
  },
});
