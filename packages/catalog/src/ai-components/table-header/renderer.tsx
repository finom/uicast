import { createAIComponentRenderer } from "@ui-fired/react";
import {
  TableHeader as ShadcnTableHeader,
  TableRow,
  TableHead,
} from "@ui-fired/catalog/components/ui/table";
import Skeleton from "react-loading-skeleton";
import { TableHeaderDef } from "./def";

export const TableHeaderRenderer = createAIComponentRenderer({
  def: TableHeaderDef,
  renderer: ({ children, generatedKey }) => {
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
