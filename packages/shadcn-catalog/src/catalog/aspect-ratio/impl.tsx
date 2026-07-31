import { createComponentImplementation } from "@uicast/react";
import { AspectRatio } from "../../components/ui/aspect-ratio";
import { AspectRatioDef } from "./def";

export const AspectRatioImpl = createComponentImplementation({
  def: AspectRatioDef,
  render: ({ ratio = 16 / 9, children, generatedKey }) => {
    return (
      <div data-key={generatedKey}>
        <AspectRatio ratio={ratio}>{children}</AspectRatio>
      </div>
    );
  },
});
