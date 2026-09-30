import { createComponentImplementation } from "@uicast/react";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { ScrollArea, ScrollBar } from "../../components/ui/scroll-area";
import { clickByKeyboard, cn } from "../../lib/utils";
import { DataGridDef } from "./def";
import { columnWidth } from "../../lib/sizes";
import { blockSkeleton } from "../../lib/skeletons";

export const DataGridImpl = createComponentImplementation({
  def: DataGridDef,
  render: ({ columns, rows, maxHeight, striped, onRowClick }, { entry }) => (
    <div className="rounded-md border overflow-hidden" data-key={entry.key}>
      {/* The viewport fills the root's height, and a root with only a max height has none. */}
      <ScrollArea style={{ maxHeight }} className="*:data-[slot=scroll-area-viewport]:max-h-[inherit]">
        {/* Not the ui Table: its overflow wrapper would become the sticky header's scroll container. */}
        <table className="w-full text-sm">
          <TableHeader className="sticky top-0 z-10 bg-muted">
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col.key} style={col.width ? { width: columnWidth(col.width) } : undefined}>
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, rowIndex) => (
              <TableRow
                key={rowIndex}
                className={cn(
                  entry.callbacks?.onRowClick && "cursor-pointer",
                  striped && rowIndex % 2 === 1 && "bg-muted/30",
                )}
                onClick={() => onRowClick({ rowIndex, row })}
                {...clickByKeyboard(!!entry.callbacks?.onRowClick)}
              >
                {columns.map((col) => (
                  <TableCell key={col.key}>{String(row[col.key] ?? "")}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  ),
  skeleton: blockSkeleton(320),
});
