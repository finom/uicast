import z from "zod";
import { createAIComponentDef } from "ui-fired/core/render/createAIComponentDef";

export const AspectRatioDef = createAIComponentDef({
  name: "AspectRatio",
  description:
    "A fixed aspect ratio box for images, video, or embeds. Maintains a consistent aspect ratio regardless of content. Use AspectRatio for responsive images, video embeds, maps, or any content that needs a fixed proportional size.",
  props: z.strictObject({
    ratio: z
      .number()
      .default(16 / 9)
      .meta({
        description:
          "The aspect ratio as a decimal (e.g. 16/9 = 1.778, 4/3 = 1.333, 1/1 = 1)",
      }),
  }),
});
