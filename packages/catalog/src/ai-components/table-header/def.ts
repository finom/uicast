import z from "zod";
import { createAIComponentDef } from "@ui-fired/core/render/create-ai-component-def";

export const TableHeaderDef = createAIComponentDef({
  name: "TableHeader",
  description:
    "The header section of a Table. Must be a direct child of Table. Children should be a single TableRow containing TableHead cells. Renders a <thead> element.",
  props: z.strictObject({}),
});
