import { createComponentImplementation } from "@ui-fired/react";
import { Table as ShadcnTable } from "@ui-fired/catalog/components/ui/table";
import { TableBody, TableRow, TableCell } from "@ui-fired/catalog/components/ui/table";
import Skeleton from "react-loading-skeleton";
import { TableDef } from "./def";

export const TableImpl = createComponentImplementation({
  def: TableDef,
  render: ({ children, generatedKey }) => {
    return <ShadcnTable data-key={generatedKey}>{children}</ShadcnTable>;
  },
  placeholder: () => (
    <TableBody>
      {[0, 1, 2].map((i) => (
        <TableRow key={i}>
          <TableCell colSpan={1000}>
            <Skeleton height={20} />
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  ),
});
