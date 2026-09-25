import { createComponentImplementation } from "@uicast/react";
import { pickMouseEvent } from "../../events/mouse";
import { COLUMNS, GAP } from "../../lib/layout";
import { GridDef } from "./def";

// The skeleton's layout when its props are not known yet.
const DEFAULTS = GridDef.props.parse({});

const layout = ({ columns, gap }: typeof DEFAULTS) => `grid ${COLUMNS[columns]} ${GAP[gap]}`;

export const GridImpl = createComponentImplementation({
  def: GridDef,
  render: ({ children, onClick, ...props }, { entry }) => (
    <div className={layout(props)} onClick={(e) => onClick(pickMouseEvent(e))} data-key={entry.key}>
      {children}
    </div>
  ),
  skeleton: ({ knownProps, children }) => <div className={layout(knownProps ?? DEFAULTS)}>{children}</div>,
});
