import { createComponentImplementation } from "@uicast/react";
import {
  TableHeader as ShadcnTableHeader,
  TableRow,
  TableHead,
} from "../../components/ui/table";
import Skeleton from "react-loading-skeleton";
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
        <Skeleton height={16} />
      </TableHead>
    </TableRow>
  ),
});
