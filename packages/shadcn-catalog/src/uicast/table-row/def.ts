import { createComponentDefinition } from "@uicast/core";
import { mouseEventSchema } from "../../events/mouse";

export const TableRowDef = createComponentDefinition({
  name: "TableRow",
  description:
    "A row in a Table. Must be a child of TableHeader, TableBody, or TableFooter. Children should be TableHead (in header) or TableCell (in body/footer) components. Renders a <tr> element.",
  callbacks: {
    onClick: mouseEventSchema,
  },
});
