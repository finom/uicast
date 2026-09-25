import { createComponentImplementation } from "@uicast/react";
import { pickMouseEvent } from "../../events/mouse";
import { ALIGN, GAP, JUSTIFY } from "../../lib/layout";
import { cn } from "../../lib/utils";
import { FlexColDef } from "./def";

// The skeleton's layout when its props are not known yet.
const DEFAULTS = FlexColDef.props.parse({});

const layout = ({ gap, align, justify }: typeof DEFAULTS) =>
  cn("flex flex-col", GAP[gap], ALIGN[align], JUSTIFY[justify]);

export const FlexColImpl = createComponentImplementation({
  def: FlexColDef,
  render: ({ children, onClick, ...props }, { entry }) => (
    <div className={layout(props)} onClick={(e) => onClick(pickMouseEvent(e))} data-key={entry.key}>
      {children}
    </div>
  ),
  skeleton: ({ knownProps, children }) => <div className={layout(knownProps ?? DEFAULTS)}>{children}</div>,
});
