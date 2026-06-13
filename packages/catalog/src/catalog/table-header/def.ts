import z from "zod";
import { createComponentDefinition } from "@ui-fired/core/render/create-component-definition";

export const TableHeaderDef = createComponentDefinition({
  name: "TableHeader",
  description:
    "The header section of a Table. Must be a direct child of Table. Children should be a single TableRow containing TableHead cells. Renders a <thead> element.",
  props: z.strictObject({}),
});
