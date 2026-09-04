import { createComponentImplementation, type PlaceholderComponentProps } from "@uicast/react";
import { TableHead as ShadcnTableHead } from "../../components/ui/table";
import { Skeleton } from "../../components/ui/skeleton";
import { TableHeadDef } from "./def";
import { columnWidth } from "../../lib/sizes";

const BAR = <Skeleton style={{ height: 16 }} className="w-full" />;

export const TableHeadImpl = createComponentImplementation({
  def: TableHeadDef,
  render: ({ text, width, children}, { entry }) => {
    return (
      <ShadcnTableHead style={width ? { width: columnWidth(width) } : undefined} data-key={entry.key}>
        {children ?? text}
      </ShadcnTableHead>
    );
  },
  placeholder: ({ children }: PlaceholderComponentProps) =>
    children === undefined ? BAR : <ShadcnTableHead>{children ?? BAR}</ShadcnTableHead>,
});
