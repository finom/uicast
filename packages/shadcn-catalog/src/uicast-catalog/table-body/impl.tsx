import { createComponentImplementation } from "@uicast/react";
import { TableBody as ShadcnTableBody } from "../../components/ui/table";
import { SKELETON_ROWS, tableSkeleton } from "../../lib/table-skeleton";
import { TableBodyDef } from "./def";

export const TableBodyImpl = createComponentImplementation({
  def: TableBodyDef,
  render: ({ children }, { entry }) => <ShadcnTableBody data-key={entry.key}>{children}</ShadcnTableBody>,
  skeleton: tableSkeleton(ShadcnTableBody, SKELETON_ROWS),
});
