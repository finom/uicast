import { createComponentImplementation } from "@uicast/react";
import {
  TableHeader as ShadcnTableHeader,
  TableRow,
  TableHead,
} from "../../components/ui/table";
import { Skeleton } from "../../components/ui/skeleton";
import { TableHeaderDef } from "./def";

export const TableHeaderImpl = createComponentImplementation({
  def: TableHeaderDef,
  render: ({ children, generatedKey }) => {
    return (
      <ShadcnTableHeader data-key={generatedKey}>{children}</ShadcnTableHeader>
    );
  },
  placeholder: () => (
    <TableRow>
      <TableHead colSpan={1000}>
        <Skeleton style={{ height: 16 }} className="w-full" />
      </TableHead>
    </TableRow>
  ),
});
