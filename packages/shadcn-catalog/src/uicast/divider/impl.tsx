import { createComponentImplementation } from "@uicast/react";
import { Separator } from "../../components/ui/separator";
import { DividerDef } from "./def";

export const DividerImpl = createComponentImplementation({
  def: DividerDef,
  render: ({ orientation = "horizontal", generatedKey }) => {
    return <Separator orientation={orientation} data-key={generatedKey} />;
  },
});
