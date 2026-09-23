import { createComponentImplementation } from "@uicast/react";
import { TableHeader as ShadcnTableHeader } from "../../components/ui/table";
import { SKELETON_HEADER_ROW } from "../../lib/table-skeleton";
import { TableHeaderDef } from "./def";

export const TableHeaderImpl = createComponentImplementation({
  def: TableHeaderDef,
  render: ({ children }, { entry }) => {
    return (
      <ShadcnTableHeader data-key={entry.key}>{children}</ShadcnTableHeader>
    );
  },
  placeholder: ({ children }) =>
    children === undefined ? SKELETON_HEADER_ROW : <ShadcnTableHeader>{children ?? SKELETON_HEADER_ROW}</ShadcnTableHeader>,
});
