import z from "zod";
import { createComponentDefinition } from "@uicast/core";
import { columnWidthSchema } from "../../lib/sizes";

const rowSchema = z.record(z.string(), z.union([z.string(), z.number(), z.boolean()]).nullable());

export const DataGridDef = createComponentDefinition({
  name: "DataGrid",
  description:
    "A data grid for displaying large tabular datasets with fixed headers and scrollable body. Supports column definitions and large row counts with overflow scrolling. Use DataGrid for large datasets, reports, or any data that needs a compact scrollable table view. For simpler tables, use Table with TableHeader/TableBody/TableRow/TableCell instead.",
  props: z.strictObject({
    columns: z
      .array(
        z.strictObject({
          key: z.string().meta({
            description: "The data object key for this column",
          }),
          header: z.string().meta({
            description: "The column header display text",
          }),
          width: columnWidthSchema.optional().meta({ description: "Optional column width." }),
        }),
      )
      .meta({ description: "Array of column definitions" }),
    rows: z.array(rowSchema).meta({ description: "Array of row data objects" }),
    maxHeight: z.number().int().positive().default(400).meta({
      description: "Height in pixels before the rows scroll.",
    }),
    striped: z.boolean().default(true).meta({
      description: "Whether to use alternating row background colors",
    }),
  }),
  callbacks: {
    onRowClick: z
      .strictObject({
        rowIndex: z.number().int().nonnegative().meta({
          description: "The zero-based index of the clicked row",
        }),
        row: rowSchema.meta({ description: "The full row object, as given in `rows`." }),
      })
      .meta({ description: "Callback when a row is clicked" }),
  },
});
