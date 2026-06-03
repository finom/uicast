import { createAIComponentRenderer } from "@ui-fired/react";
import { AspectRatio } from "@ui-fired/catalog/components/ui/aspect-ratio";
import { AspectRatioDef } from "./def";

export const AspectRatioRenderer = createAIComponentRenderer({
  def: AspectRatioDef,
  renderer: ({ ratio = 16 / 9, children, generatedKey }) => {
    return (
      <div data-key={generatedKey}>
        <AspectRatio ratio={ratio}>{children}</AspectRatio>
      </div>
    );
  },
});
