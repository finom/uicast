import z from "zod";
import { createComponentDefinition } from "@ui-fired/core";

export const CarouselDef = createComponentDefinition({
  name: "Carousel",
  description:
    "A swipeable content/image slider. Renders a carousel with navigation arrows and optional dots. Use Carousel for image galleries, testimonials, product images, or any horizontally scrollable content.",
  props: z.strictObject({
    orientation: z.enum(["horizontal", "vertical"]).default("horizontal").meta({
      description: "Carousel scroll direction",
    }),
    autoplay: z.boolean().default(false).meta({
      description: "Whether to auto-advance slides",
    }),
    loop: z.boolean().default(false).meta({
      description: "Whether to loop back to the first slide after the last",
    }),
  }),
  callbacks: {
    onSlideChange: z
      .object({
        index: z.number().meta({ description: "The new active slide index" }),
      })
      .meta({ description: "Callback when the active slide changes" }),
  },
});
