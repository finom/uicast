import { Skeleton } from "../components/ui/skeleton";
import { TableCell, TableHead, TableRow } from "../components/ui/table";

// HTML caps colspan at 1000, so this spans every column.
const ALL_COLUMNS = 1000;

export const SKELETON_BAR = <Skeleton style={{ height: 16 }} className="w-full" />;

const row = (i: number) => (
  <TableRow key={i}>
    <TableCell colSpan={ALL_COLUMNS}>
      <Skeleton style={{ height: 20 }} className="w-full" />
    </TableCell>
  </TableRow>
);

export const SKELETON_ROW = row(0);
export const SKELETON_ROWS = <>{[0, 1, 2].map(row)}</>;
export const SKELETON_HEADER_ROW = (
  <TableRow>
    <TableHead colSpan={ALL_COLUMNS}>{SKELETON_BAR}</TableHead>
  </TableRow>
);
