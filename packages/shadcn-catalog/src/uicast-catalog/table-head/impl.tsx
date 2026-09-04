import { createComponentImplementation } from "@uicast/react";
import { TableHead as ShadcnTableHead } from "../../components/ui/table";
import { TableHeadDef } from "./def";
import { columnWidth } from "../../lib/sizes";

export const TableHeadImpl = createComponentImplementation({
  def: TableHeadDef,
  render: ({ text, width, children}, { entry }) => {
    return (
      <ShadcnTableHead style={width ? { width: columnWidth(width) } : undefined} data-key={entry.key}>
        {children ?? text}
      </ShadcnTableHead>
    );
  },
});
