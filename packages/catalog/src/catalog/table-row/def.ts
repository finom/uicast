import z from "zod";
import { createComponentDefinition } from "@ui-fired/core/def/create-component-definition";
import { onClickSchema } from "@ui-fired/catalog/render/shared";

export const TableRowDef = createComponentDefinition({
  name: "TableRow",
  description:
    "A row in a Table. Must be a child of TableHeader, TableBody, or TableFooter. Children should be TableHead (in header) or TableCell (in body/footer) components. Renders a <tr> element.",
  props: z.strictObject({}),
  callbacks: {
    onClick: onClickSchema,
  },
});
