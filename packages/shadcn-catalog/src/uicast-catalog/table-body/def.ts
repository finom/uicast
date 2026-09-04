import { createComponentDefinition } from "@uicast/core";

export const TableBodyDef = createComponentDefinition({
  name: "TableBody",
  description:
    "The body section of a Table. Must be a direct child of Table, after TableHeader. Children should be TableRow components (often rendered as a list). Renders a <tbody> element.",
});
