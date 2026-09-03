import { createComponentImplementation } from "@uicast/react";
import { busy } from "../../lib/utils";
import { Table as ShadcnTable } from "../../components/ui/table";
import { TableBody, TableRow, TableCell } from "../../components/ui/table";
import { Skeleton } from "../../components/ui/skeleton";
import { TableDef } from "./def";

export const TableImpl = createComponentImplementation({
  def: TableDef,
  render: ({ children}, { entry, loading }) => {
    return <ShadcnTable className={busy(loading)} aria-busy={loading || undefined} data-key={entry.key}>{children}</ShadcnTable>;
  },
  placeholder: () => (
    <TableBody>
      {[0, 1, 2].map((i) => (
        <TableRow key={i}>
          <TableCell colSpan={1000}>
            <Skeleton style={{ height: 20 }} className="w-full" />
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  ),
});
