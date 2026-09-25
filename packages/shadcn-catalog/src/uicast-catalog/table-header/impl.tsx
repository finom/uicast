import { createComponentImplementation } from "@uicast/react";
import { TableHeader as ShadcnTableHeader } from "../../components/ui/table";
import { SKELETON_HEADER_ROW, tableSkeleton } from "../../lib/table-skeleton";
import { TableHeaderDef } from "./def";

export const TableHeaderImpl = createComponentImplementation({
  def: TableHeaderDef,
  render: ({ children }, { entry }) => <ShadcnTableHeader data-key={entry.key}>{children}</ShadcnTableHeader>,
  skeleton: tableSkeleton(ShadcnTableHeader, SKELETON_HEADER_ROW),
});
