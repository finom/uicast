import { createComponentImplementation, type PlaceholderComponentProps } from "@uicast/react";
import {
  TableBody as ShadcnTableBody,
  TableRow,
  TableCell,
} from "../../components/ui/table";
import { Skeleton } from "../../components/ui/skeleton";
import { TableBodyDef } from "./def";

const ROWS = (
  <>
    {[0, 1, 2].map((i) => (
      <TableRow key={i}>
        <TableCell colSpan={1000}>
          <Skeleton style={{ height: 20 }} className="w-full" />
        </TableCell>
      </TableRow>
    ))}
  </>
);

export const TableBodyImpl = createComponentImplementation({
  def: TableBodyDef,
  render: ({ children}, { entry }) => {
    return (
      <ShadcnTableBody data-key={entry.key}>{children}</ShadcnTableBody>
    );
  },
  placeholder: ({ children }: PlaceholderComponentProps) =>
    children === undefined ? ROWS : <ShadcnTableBody>{children ?? ROWS}</ShadcnTableBody>,
});
