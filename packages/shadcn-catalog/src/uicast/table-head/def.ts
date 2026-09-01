import z from "zod";
import { createComponentDefinition } from "@uicast/core";

export const TableHeadDef = createComponentDefinition({
  name: "TableHead",
  description:
    "A header cell in a table row. Must be a child of a TableRow inside a TableHeader. Renders a <th> element. Use the `text` prop for the column header label.",
  props: z.strictObject({
    text: z
      .union([z.string(), z.number()])
      .optional()
      .meta({ description: "The column header text" }),
  }),
});
