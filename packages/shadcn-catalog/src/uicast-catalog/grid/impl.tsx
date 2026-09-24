import { createComponentImplementation } from "@uicast/react";
import { COLUMNS, GAP } from "../../lib/layout";
import { pickMouseEvent } from "../../events/mouse";
import { GridDef } from "./def";

export const GridImpl = createComponentImplementation({
  def: GridDef,
  render: ({ columns, gap, children, onClick }, { entry }) => {
    return (
      <div
        className={`grid ${COLUMNS[columns]} ${GAP[gap]}`}
        onClick={(e) => onClick(pickMouseEvent(e))}
        data-key={entry.key}
      >
        {children}
      </div>
    );
  },
  skeleton: ({ knownProps, children }) => (
    <div className={`grid ${COLUMNS[knownProps?.columns ?? "3"]} ${GAP[knownProps?.gap ?? "4"]}`}>{children}</div>
  ),
});
