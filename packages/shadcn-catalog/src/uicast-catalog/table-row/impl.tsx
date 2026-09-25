import { createComponentImplementation } from "@uicast/react";
import { TableRow as ShadcnTableRow } from "../../components/ui/table";
import { pickMouseEvent } from "../../events/mouse";
import { SKELETON_CELL, tableSkeleton } from "../../lib/table-skeleton";
import { TableRowDef } from "./def";

export const TableRowImpl = createComponentImplementation({
  def: TableRowDef,
  render: ({ children, onClick }, { entry }) => (
    <ShadcnTableRow onClick={(e) => onClick(pickMouseEvent(e))} data-key={entry.key}>
      {children}
    </ShadcnTableRow>
  ),
  skeleton: tableSkeleton(ShadcnTableRow, SKELETON_CELL),
});
