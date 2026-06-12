import { createAIComponentRenderer } from "@ui-fired/react";
import { Separator } from "@ui-fired/catalog/components/ui/separator";
import { DividerDef } from "./def";

export const DividerRenderer = createAIComponentRenderer({
  def: DividerDef,
  renderer: ({ orientation = "horizontal", generatedKey }) => {
    return <Separator orientation={orientation} data-key={generatedKey} />;
  },
});
