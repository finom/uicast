import { createAIComponentRenderer } from "@ui-fired/core/render/createAIComponentRenderer";
import { TableCell as ShadcnTableCell } from "@ui-fired/catalog/components/ui/table";
import { TableCellDef } from "./def";

export const TableCellRenderer = createAIComponentRenderer({
  def: TableCellDef,
  renderer: ({ children, generatedKey }) => {
    return (
      <ShadcnTableCell data-key={generatedKey}>{children}</ShadcnTableCell>
    );
  },
});
