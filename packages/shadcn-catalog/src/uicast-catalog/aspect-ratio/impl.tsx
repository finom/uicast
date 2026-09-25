import { createComponentImplementation } from "@uicast/react";
import { AspectRatio } from "../../components/ui/aspect-ratio";
import { AspectRatioDef } from "./def";

export const AspectRatioImpl = createComponentImplementation({
  def: AspectRatioDef,
  render: ({ ratio, children }, { entry }) => (
    <div data-key={entry.key}>
      <AspectRatio ratio={ratio}>{children}</AspectRatio>
    </div>
  ),
});
