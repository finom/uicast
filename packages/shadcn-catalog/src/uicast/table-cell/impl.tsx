import { createComponentImplementation } from "@uicast/react";
import { TableCell as ShadcnTableCell } from "../../components/ui/table";
import { TableCellDef } from "./def";

export const TableCellImpl = createComponentImplementation({
  def: TableCellDef,
  render: ({ text, children, generatedKey }) => {
    return (
      <ShadcnTableCell data-key={generatedKey}>{children ?? text}</ShadcnTableCell>
    );
  },
});
