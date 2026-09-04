import { createComponentImplementation, type PlaceholderComponentProps } from "@uicast/react";
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
  placeholder: ({ children }: PlaceholderComponentProps) => <div className="flex flex-col gap-2">{children}</div>,
});
