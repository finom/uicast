import z from "zod";
import { createComponentDefinition } from "@uicast/core";

export const TableCellDef = createComponentDefinition({
  name: "TableCell",
  description:
    "A data cell in a table row. Must be a child of a TableRow inside TableBody or TableFooter. Renders a <td> element. Can display text via children prop or contain child components (Input, Button, Badge, etc.).",
  props: z.strictObject({
    children: z
      .any()
      .optional()
      .meta({ description: "The cell content text or value" }),
  }),
});
