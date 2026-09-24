import { createComponentImplementation } from "@uicast/react";
import { busy } from "../../lib/utils";
import { Table as ShadcnTable, TableBody } from "../../components/ui/table";
import { SKELETON_ROWS } from "../../lib/table-skeleton";
import { TableDef } from "./def";

export const TableImpl = createComponentImplementation({
  def: TableDef,
  render: ({ children }, { entry, loading }) => {
    return <ShadcnTable className={busy(loading)} aria-busy={loading || undefined} data-key={entry.key}>{children}</ShadcnTable>;
  },
  skeleton: ({ children }) =>
    children === undefined ? <TableBody>{SKELETON_ROWS}</TableBody> : <ShadcnTable>{children ?? <TableBody>{SKELETON_ROWS}</TableBody>}</ShadcnTable>,
});
