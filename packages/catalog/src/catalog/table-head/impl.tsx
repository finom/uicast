import { createComponentImplementation } from "@ui-fired/react";
import { TableHead as ShadcnTableHead } from "@ui-fired/catalog/components/ui/table";
import { TableHeadDef } from "./def";

export const TableHeadImpl = createComponentImplementation({
  def: TableHeadDef,
  render: ({ children, generatedKey }) => {
    return (
      <ShadcnTableHead data-key={generatedKey}>{children}</ShadcnTableHead>
    );
  },
});
