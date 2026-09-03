import { createComponentImplementation } from "@uicast/react";
import {
  TableFooter as ShadcnTableFooter,
  TableRow,
  TableCell,
} from "../../components/ui/table";
import { Skeleton } from "../../components/ui/skeleton";
import { TableFooterDef } from "./def";

export const TableFooterImpl = createComponentImplementation({
  def: TableFooterDef,
  render: ({ children}, { entry }) => {
    return (
      <ShadcnTableFooter data-key={entry.key}>{children}</ShadcnTableFooter>
    );
  },
  placeholder: () => (
    <TableRow>
      <TableCell colSpan={1000}>
        <Skeleton style={{ height: 20 }} className="w-full" />
      </TableCell>
    </TableRow>
  ),
});
