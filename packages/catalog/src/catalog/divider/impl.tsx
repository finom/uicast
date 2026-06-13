import { createComponentImplementation } from "@ui-fired/react";
import { Separator } from "@ui-fired/catalog/components/ui/separator";
import { DividerDef } from "./def";

export const DividerImpl = createComponentImplementation({
  def: DividerDef,
  render: ({ orientation = "horizontal", generatedKey }) => {
    return <Separator orientation={orientation} data-key={generatedKey} />;
  },
});
