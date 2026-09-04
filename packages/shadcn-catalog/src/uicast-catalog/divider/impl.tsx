import { createComponentImplementation } from "@uicast/react";
import { Separator } from "../../components/ui/separator";
import { DividerDef } from "./def";

export const DividerImpl = createComponentImplementation({
  def: DividerDef,
  render: ({ orientation}, { entry }) => {
    return <Separator orientation={orientation} data-key={entry.key} />;
  },
});
