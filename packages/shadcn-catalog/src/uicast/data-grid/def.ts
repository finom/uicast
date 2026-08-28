import z from "zod";
import { createComponentDefinition } from "@uicast/core";

export const DataGridDef = createComponentDefinition({
  name: "DataGrid",
  description:
    "A data grid for displaying large tabular datasets with fixed headers and scrollable body. Supports column definitions and large row counts with overflow scrolling. Use DataGrid for large datasets, reports, or any data that needs a compact scrollable table view. For simpler tables, use Table with TableHeader/TableBody/TableRow/TableCell instead.",
  props: z.strictObject({
    columns: z
      .array(
        z.object({
          key: z.string().meta({
            description: "The data object key for this column",
          }),
          header: z.string().meta({
            description: "The column header display text",
          }),
          width: z.string().optional().meta({
            description: "Optional CSS width, e.g. '200px' or '20%'",
          }),
        }),
      )
      .meta({ description: "Array of column definitions" }),
    rows: z
      .array(
        z.record(
          z.string(),
          z.union([z.string(), z.number(), z.boolean()]).nullable(),
        ),
      )
      .meta({ description: "Array of row data objects" }),
    maxHeight: z.string().default("400px").meta({
      description:
        "Maximum height of the scrollable area, e.g. '400px' or '60vh'",
    }),
    striped: z.boolean().default(true).meta({
      description: "Whether to use alternating row background colors",
    }),
  }),
  callbacks: {
    onRowClick: z
      .object({
        rowIndex: z.number().meta({
          description: "The zero-based index of the clicked row",
        }),
        row: z.record(z.string(), z.any()).meta({
          description: "The full row data object",
        }),
      })
      .meta({ description: "Callback when a row is clicked" }),
  },
});
