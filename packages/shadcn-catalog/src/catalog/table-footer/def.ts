import z from "zod";
import { createComponentDefinition } from "uicast";

export const TableFooterDef = createComponentDefinition({
  name: "TableFooter",
  description:
    "The footer section of a Table. Optional, placed after TableBody. Children should be a TableRow with TableCell elements for totals, summaries, or pagination. Renders a <tfoot> element.",
  props: z.strictObject({}),
});
