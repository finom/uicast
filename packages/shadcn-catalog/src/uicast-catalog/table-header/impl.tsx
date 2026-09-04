import { createComponentImplementation, type PlaceholderComponentProps } from "@uicast/react";
import {
  TableHeader as ShadcnTableHeader,
  TableRow,
  TableHead,
} from "../../components/ui/table";
import { Skeleton } from "../../components/ui/skeleton";
import { TableHeaderDef } from "./def";

const ROWS = (
  <TableRow>
    <TableHead colSpan={1000}>
      <Skeleton style={{ height: 16 }} className="w-full" />
    </TableHead>
  </TableRow>
);

export const TableHeaderImpl = createComponentImplementation({
  def: TableHeaderDef,
  render: ({ children}, { entry }) => {
    return (
      <ShadcnTableHeader data-key={entry.key}>{children}</ShadcnTableHeader>
    );
  },
  placeholder: ({ children }: PlaceholderComponentProps) =>
    children === undefined ? ROWS : <ShadcnTableHeader>{children ?? ROWS}</ShadcnTableHeader>,
});
