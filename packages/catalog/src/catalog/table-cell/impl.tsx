import { createComponentImplementation } from "@ui-fired/react";
import { TableCell as ShadcnTableCell } from "@ui-fired/catalog/components/ui/table";
import { TableCellDef } from "./def";

export const TableCellImpl = createComponentImplementation({
  def: TableCellDef,
  render: ({ children, generatedKey }) => {
    return (
      <ShadcnTableCell data-key={generatedKey}>{children}</ShadcnTableCell>
    );
  },
});
