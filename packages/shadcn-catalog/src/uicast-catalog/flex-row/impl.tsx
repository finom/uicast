import { createComponentImplementation } from "@uicast/react";
import { pickMouseEvent } from "../../events/mouse";
import { ALIGN, GAP, JUSTIFY } from "../../lib/layout";
import { cn } from "../../lib/utils";
import { FlexRowDef } from "./def";

// The skeleton's layout when its props are not known yet.
const DEFAULTS = FlexRowDef.props.parse({});

const layout = ({ gap, align, justify, wrap, equalWidth }: typeof DEFAULTS) =>
  cn(
    "flex flex-row",
    GAP[gap],
    ALIGN[align],
    JUSTIFY[justify],
    wrap && "flex-wrap",
    equalWidth && "*:flex-1 *:min-w-0",
  );

export const FlexRowImpl = createComponentImplementation({
  def: FlexRowDef,
  render: ({ children, onClick, ...props }, { entry }) => (
    <div className={layout(props)} onClick={(e) => onClick(pickMouseEvent(e))} data-key={entry.key}>
      {children}
    </div>
  ),
  skeleton: ({ knownProps, children }) => <div className={layout(knownProps ?? DEFAULTS)}>{children}</div>,
});
