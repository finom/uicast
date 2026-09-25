import { createComponentImplementation } from "@uicast/react";
import { TableCell as ShadcnTableCell } from "../../components/ui/table";
import { SKELETON_BAR, tableSkeleton } from "../../lib/table-skeleton";
import { TableCellDef } from "./def";

export const TableCellImpl = createComponentImplementation({
  def: TableCellDef,
  render: ({ text, children }, { entry }) => <ShadcnTableCell data-key={entry.key}>{children ?? text}</ShadcnTableCell>,
  skeleton: tableSkeleton(ShadcnTableCell, SKELETON_BAR),
});
