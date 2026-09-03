import { createComponentImplementation } from "@uicast/react";
import { TableCell as ShadcnTableCell } from "../../components/ui/table";
import { TableCellDef } from "./def";

export const TableCellImpl = createComponentImplementation({
  def: TableCellDef,
  render: ({ text, children}, { entry }) => {
    return (
      <ShadcnTableCell data-key={entry.key}>{children ?? text}</ShadcnTableCell>
    );
  },
});
