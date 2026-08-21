import z from "zod";
import { createComponentDefinition } from "uicast";

export const CarouselDef = createComponentDefinition({
  name: "Carousel",
  description:
    "A content/image slider stepped with previous/next arrow buttons. Renders one slide at a time. Use Carousel for image galleries, testimonials, product images, or any slide-based content.",
  props: z.strictObject({
    orientation: z.enum(["horizontal", "vertical"]).default("horizontal").meta({
      description: "Carousel scroll direction",
    }),
    loop: z.boolean().default(false).meta({
      description: "Whether to loop back to the first slide after the last",
    }),
  }),
});
