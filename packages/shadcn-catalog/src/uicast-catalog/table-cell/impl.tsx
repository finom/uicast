import { createComponentImplementation, type PlaceholderComponentProps } from "@uicast/react";
import { TableCell as ShadcnTableCell } from "../../components/ui/table";
import { Skeleton } from "../../components/ui/skeleton";
import { TableCellDef } from "./def";

const BAR = <Skeleton style={{ height: 16 }} className="w-full" />;

export const TableCellImpl = createComponentImplementation({
  def: TableCellDef,
  render: ({ text, children}, { entry }) => {
    return (
      <ShadcnTableCell data-key={entry.key}>{children ?? text}</ShadcnTableCell>
    );
  },
  placeholder: ({ children }: PlaceholderComponentProps) =>
    children === undefined ? BAR : <ShadcnTableCell>{children ?? BAR}</ShadcnTableCell>,
});
