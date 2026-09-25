import type { ComponentType, ReactElement, ReactNode } from "react";
import { Skeleton } from "../components/ui/skeleton";
import { TableCell, TableHead, TableRow } from "../components/ui/table";

// HTML caps colspan at 1000, so this spans every column.
const ALL_COLUMNS = 1000;

export const SKELETON_BAR = <Skeleton style={{ height: 16 }} className="w-full" />;

export const SKELETON_CELL = (
  <TableCell colSpan={ALL_COLUMNS}>
    <Skeleton style={{ height: 20 }} className="w-full" />
  </TableCell>
);

const row = (i: number) => <TableRow key={i}>{SKELETON_CELL}</TableRow>;

export const SKELETON_ROW = row(0);
export const SKELETON_ROWS = <>{[0, 1, 2].map(row)}</>;
export const SKELETON_HEADER_ROW = (
  <TableRow>
    <TableHead colSpan={ALL_COLUMNS}>{SKELETON_BAR}</TableHead>
  </TableRow>
);

// In a child's slot `children` is absent and the skeleton stands for one child, so it is the placeholder alone.
export const tableSkeleton =
  (Part: ComponentType<{ children?: ReactNode }>, placeholder: ReactElement) =>
  ({ children }: { children?: ReactNode }) =>
    children === undefined ? placeholder : <Part>{children ?? placeholder}</Part>;
