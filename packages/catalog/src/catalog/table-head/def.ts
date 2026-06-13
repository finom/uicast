import z from "zod";
import { createComponentDefinition } from "@ui-fired/core/render/create-component-definition";

export const TableHeadDef = createComponentDefinition({
  name: "TableHead",
  description:
    "A header cell in a table row. Must be a child of a TableRow inside a TableHeader. Renders a <th> element. Use the children prop for the column header label text.",
  props: z.strictObject({
    children: z
      .any()
      .optional()
      .meta({ description: "The column header text" }),
  }),
});
