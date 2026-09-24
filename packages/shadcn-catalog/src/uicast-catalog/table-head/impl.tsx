import { createComponentImplementation } from "@uicast/react";
import { TableHead as ShadcnTableHead } from "../../components/ui/table";
import { SKELETON_BAR } from "../../lib/table-skeleton";
import { TableHeadDef } from "./def";
import { columnWidth } from "../../lib/sizes";

export const TableHeadImpl = createComponentImplementation({
  def: TableHeadDef,
  render: ({ text, width, children }, { entry }) => {
    return (
      <ShadcnTableHead style={width ? { width: columnWidth(width) } : undefined} data-key={entry.key}>
        {children ?? text}
      </ShadcnTableHead>
    );
  },
  skeleton: ({ children }) =>
    children === undefined ? SKELETON_BAR : <ShadcnTableHead>{children ?? SKELETON_BAR}</ShadcnTableHead>,
});
