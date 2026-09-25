import { createComponentImplementation } from "@uicast/react";
import { TableFooter as ShadcnTableFooter } from "../../components/ui/table";
import { SKELETON_ROW, tableSkeleton } from "../../lib/table-skeleton";
import { TableFooterDef } from "./def";

export const TableFooterImpl = createComponentImplementation({
  def: TableFooterDef,
  render: ({ children }, { entry }) => <ShadcnTableFooter data-key={entry.key}>{children}</ShadcnTableFooter>,
  skeleton: tableSkeleton(ShadcnTableFooter, SKELETON_ROW),
});
