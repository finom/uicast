import { createComponentImplementation } from "@ui-fired/react";
import {
  TableRow as ShadcnTableRow,
  TableCell,
} from "@ui-fired/catalog/components/ui/table";
import { pickClick } from "@ui-fired/catalog/render/shared";
import Skeleton from "react-loading-skeleton";
import { TableRowDef } from "./def";

export const TableRowImpl = createComponentImplementation({
  def: TableRowDef,
  render: ({ children, onClick, generatedKey }) => {
    return (
      <ShadcnTableRow
        onClick={(e) => onClick?.(pickClick(e))}
        data-key={generatedKey}
      >
        {children}
      </ShadcnTableRow>
    );
  },
  placeholder: () => (
    <TableCell colSpan={1000}>
      <Skeleton height={20} />
    </TableCell>
  ),
});
