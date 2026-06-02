import { createAIComponentRenderer } from "@ui-fired/core/render/createAIComponentRenderer";
import {
  TableRow as ShadcnTableRow,
  TableCell,
} from "@ui-fired/catalog/components/ui/table";
import { pickClick } from "@ui-fired/core/render/shared";
import Skeleton from "react-loading-skeleton";
import { TableRowDef } from "./def";

export const TableRowRenderer = createAIComponentRenderer({
  def: TableRowDef,
  renderer: ({ children, onClick, generatedKey }) => {
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
