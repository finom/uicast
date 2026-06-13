import z from "zod";
import { createComponentDefinition } from "@ui-fired/core/render/create-component-definition";

export const TableDef = createComponentDefinition({
  name: "Table",
  description:
    "A table container for displaying tabular data. Children must be TableHeader, TableBody, and optionally TableFooter components in that order. Use Table for any structured data display (user lists, product inventories, reports, etc.).",
  props: z.strictObject({}),
});
