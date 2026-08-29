import { createComponentImplementation } from "@uicast/react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { ScrollArea, ScrollBar } from "../../components/ui/scroll-area";
import { DataGridDef } from "./def";

export const DataGridImpl = createComponentImplementation({
  def: DataGridDef,
  render: ({
    columns = [],
    rows = [],
    maxHeight,
    striped,
    onRowClick,
    generatedKey,
  }) => {
    return (
      <div
        className="rounded-md border overflow-hidden"
        data-key={generatedKey}
      >
        <ScrollArea style={{ maxHeight }}>
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-muted">
              <TableRow>
                {columns.map((col) => (
                  <TableHead
                    key={col.key}
                    style={col.width ? { width: col.width } : undefined}
                  >
                    {col.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, rowIndex) => (
                <TableRow
                  key={rowIndex}
                  className={`cursor-pointer ${
                    striped && rowIndex % 2 === 1 ? "bg-muted/30" : ""
                  }`}
                  onClick={() => onRowClick({ rowIndex, row })}
                >
                  {columns.map((col) => (
                    <TableCell key={col.key}>
                      {String(row[col.key] ?? "")}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    );
  },
});
