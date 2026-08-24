import { createComponentImplementation } from "@uicast/react";
import {
  TableBody as ShadcnTableBody,
  TableRow,
  TableCell,
} from "../../components/ui/table";
import { Skeleton } from "../../components/ui/skeleton";
import { TableBodyDef } from "./def";

export const TableBodyImpl = createComponentImplementation({
  def: TableBodyDef,
  render: ({ children, generatedKey }) => {
    return (
      <ShadcnTableBody data-key={generatedKey}>{children}</ShadcnTableBody>
    );
  },
  placeholder: () => (
    <>
      {[0, 1, 2].map((i) => (
        <TableRow key={i}>
          <TableCell colSpan={1000}>
            <Skeleton style={{ height: 20 }} className="w-full" />
          </TableCell>
        </TableRow>
      ))}
    </>
  ),
});
