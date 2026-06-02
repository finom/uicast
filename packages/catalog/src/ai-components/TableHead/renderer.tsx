import { createAIComponentRenderer } from "@ui-fired/core/render/createAIComponentRenderer";
import { TableHead as ShadcnTableHead } from "@ui-fired/catalog/components/ui/table";
import { TableHeadDef } from "./def";

export const TableHeadRenderer = createAIComponentRenderer({
  def: TableHeadDef,
  renderer: ({ children, generatedKey }) => {
    return (
      <ShadcnTableHead data-key={generatedKey}>{children}</ShadcnTableHead>
    );
  },
});
