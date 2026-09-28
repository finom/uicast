import z from "zod";
import { createComponentDefinition } from "@uicast/core";

export const TableCellDef = createComponentDefinition({
  name: "TableCell",
  description:
    "A data cell in a table row. Must be a child of a TableRow inside TableBody or TableFooter. Renders a <td> element. Displays the `text` prop, or its child entries when it has them: an input, a button, a badge.",
  props: z.strictObject({
    text: z
      .union([z.string(), z.number()])
      .optional()
      .meta({ description: "The cell text — format numbers before passing them" }),
  }),
});
