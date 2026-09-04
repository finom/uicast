import z from "zod";
import { createComponentDefinition } from "@uicast/core";
import { columnWidthSchema } from "../../lib/sizes";

export const TableHeadDef = createComponentDefinition({
  name: "TableHead",
  description:
    "A header cell in a table row. Must be a child of a TableRow inside a TableHeader. Renders a <th> element. Use the `text` prop for the column header label.",
  props: z.strictObject({
    text: z
      .union([z.string(), z.number()])
      .optional()
      .meta({ description: "The column header text" }),
    width: columnWidthSchema.optional().meta({
      description:
        "The column's width. Set it on a column holding inputs or buttons, which have no width of their own.",
    }),
  }),
});
