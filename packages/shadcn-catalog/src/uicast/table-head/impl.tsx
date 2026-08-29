import { createComponentImplementation } from "@uicast/react";
import { TableHead as ShadcnTableHead } from "../../components/ui/table";
import { TableHeadDef } from "./def";

export const TableHeadImpl = createComponentImplementation({
  def: TableHeadDef,
  render: ({ text, children, generatedKey }) => {
    return (
      <ShadcnTableHead data-key={generatedKey}>{children ?? text}</ShadcnTableHead>
    );
  },
});
