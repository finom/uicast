import { createComponentImplementation, type PlaceholderComponentProps } from "@uicast/react";
import {
  TableRow as ShadcnTableRow,
  TableCell,
} from "../../components/ui/table";
import { pickMouseEvent } from "../../events/mouse";
import { Skeleton } from "../../components/ui/skeleton";
import { TableRowDef } from "./def";

const CELLS = (
  <TableCell colSpan={1000}>
    <Skeleton style={{ height: 20 }} className="w-full" />
  </TableCell>
);

export const TableRowImpl = createComponentImplementation({
  def: TableRowDef,
  render: ({ children, onClick}, { entry }) => {
    return (
      <ShadcnTableRow
        onClick={(e) => onClick(pickMouseEvent(e))}
        data-key={entry.key}
      >
        {children}
      </ShadcnTableRow>
    );
  },
  placeholder: ({ children }: PlaceholderComponentProps) =>
    children === undefined ? CELLS : <ShadcnTableRow>{children ?? CELLS}</ShadcnTableRow>,
});
