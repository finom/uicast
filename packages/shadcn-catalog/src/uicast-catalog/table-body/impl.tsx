import { createComponentImplementation } from "@uicast/react";
import { TableBody as ShadcnTableBody } from "../../components/ui/table";
import { SKELETON_ROWS } from "../../lib/table-skeleton";
import { TableBodyDef } from "./def";

export const TableBodyImpl = createComponentImplementation({
  def: TableBodyDef,
  render: ({ children }, { entry }) => {
    return <ShadcnTableBody data-key={entry.key}>{children}</ShadcnTableBody>;
  },
  placeholder: ({ children }) =>
    children === undefined ? SKELETON_ROWS : <ShadcnTableBody>{children ?? SKELETON_ROWS}</ShadcnTableBody>,
});
