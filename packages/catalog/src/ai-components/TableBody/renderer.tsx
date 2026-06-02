import { createAIComponentRenderer } from "@ui-fired/core/render/createAIComponentRenderer";
import {
  TableBody as ShadcnTableBody,
  TableRow,
  TableCell,
} from "@ui-fired/catalog/components/ui/table";
import Skeleton from "react-loading-skeleton";
import { TableBodyDef } from "./def";

export const TableBodyRenderer = createAIComponentRenderer({
  def: TableBodyDef,
  renderer: ({ children, generatedKey }) => {
    return (
      <ShadcnTableBody data-key={generatedKey}>{children}</ShadcnTableBody>
    );
  },
  placeholder: () => (
    <>
      {[0, 1, 2].map((i) => (
        <TableRow key={i}>
          <TableCell colSpan={1000}>
            <Skeleton height={20} />
          </TableCell>
        </TableRow>
      ))}
    </>
  ),
});
