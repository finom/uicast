import { createAIComponentRenderer } from "@ui-fired/react";
import { SpacerDef } from "./def";

export const SpacerRenderer = createAIComponentRenderer({
  def: SpacerDef,
  renderer: ({ size = "4", direction = "vertical", generatedKey }) => {
    const sizeMap: Record<string, string> = {
      "1": "0.25rem",
      "2": "0.5rem",
      "3": "0.75rem",
      "4": "1rem",
      "6": "1.5rem",
      "8": "2rem",
      "12": "3rem",
      "16": "4rem",
    };
    const style =
      direction === "vertical"
        ? { height: sizeMap[size] }
        : { width: sizeMap[size], display: "inline-block" };
    return <div style={style} data-key={generatedKey} />;
  },
});
