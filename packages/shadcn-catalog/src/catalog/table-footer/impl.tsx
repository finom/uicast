import { createComponentImplementation } from "@uicast/react";
import {
  TableFooter as ShadcnTableFooter,
  TableRow,
  TableCell,
} from "../../components/ui/table";
import Skeleton from "react-loading-skeleton";
import { TableFooterDef } from "./def";

export const TableFooterImpl = createComponentImplementation({
  def: TableFooterDef,
  render: ({ children, generatedKey }) => {
    return (
      <ShadcnTableFooter data-key={generatedKey}>{children}</ShadcnTableFooter>
    );
  },
  placeholder: () => (
    <TableRow>
      <TableCell colSpan={1000}>
        <Skeleton height={20} />
      </TableCell>
    </TableRow>
  ),
});
