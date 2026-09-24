import { createComponentImplementation } from "@uicast/react";
import { TableFooter as ShadcnTableFooter } from "../../components/ui/table";
import { SKELETON_ROW } from "../../lib/table-skeleton";
import { TableFooterDef } from "./def";

export const TableFooterImpl = createComponentImplementation({
  def: TableFooterDef,
  render: ({ children }, { entry }) => {
    return (
      <ShadcnTableFooter data-key={entry.key}>{children}</ShadcnTableFooter>
    );
  },
  skeleton: ({ children }) =>
    children === undefined ? SKELETON_ROW : <ShadcnTableFooter>{children ?? SKELETON_ROW}</ShadcnTableFooter>,
});
