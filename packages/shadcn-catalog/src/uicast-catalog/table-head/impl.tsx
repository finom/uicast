import { createComponentImplementation } from "@uicast/react";
import { TableHead as ShadcnTableHead } from "../../components/ui/table";
import { columnWidth } from "../../lib/sizes";
import { SKELETON_BAR, tableSkeleton } from "../../lib/table-skeleton";
import { TableHeadDef } from "./def";

export const TableHeadImpl = createComponentImplementation({
  def: TableHeadDef,
  render: ({ text, width, children }, { entry }) => (
    <ShadcnTableHead style={width ? { width: columnWidth(width) } : undefined} data-key={entry.key}>
      {children ?? text}
    </ShadcnTableHead>
  ),
  skeleton: tableSkeleton(ShadcnTableHead, SKELETON_BAR),
});
