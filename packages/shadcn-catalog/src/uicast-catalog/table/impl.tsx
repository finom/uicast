import { createComponentImplementation } from "@uicast/react";
import { Table as ShadcnTable, TableBody } from "../../components/ui/table";
import { SKELETON_ROWS, tableSkeleton } from "../../lib/table-skeleton";
import { busy } from "../../lib/utils";
import { TableDef } from "./def";

export const TableImpl = createComponentImplementation({
  def: TableDef,
  render: ({ children }, { entry, loading }) => (
    <ShadcnTable className={busy(loading)} aria-busy={loading || undefined} data-key={entry.key}>
      {children}
    </ShadcnTable>
  ),
  skeleton: tableSkeleton(ShadcnTable, <TableBody>{SKELETON_ROWS}</TableBody>),
});
