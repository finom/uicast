import z from "zod";
import { createComponentDefinition } from "@ui-fired/core/def/create-component-definition";
import { onClickSchema } from "@ui-fired/catalog/render/shared";

export const ImageDef = createComponentDefinition({
  name: "Image",
  description:
    "An image component for displaying pictures, photos, or illustrations. Renders an img element with configurable sizing and rounded corners. Use Image for product photos, user-uploaded images, hero banners, thumbnails, or any visual content.",
  props: z.strictObject({
    src: z.string().meta({
      description: "The image URL/source",
    }),
    alt: z.string().default("").meta({
      description: "Alt text for accessibility and fallback display",
    }),
    width: z.string().optional().meta({
      description: "CSS width, e.g. '100%', '200px', '16rem'",
    }),
    height: z.string().optional().meta({
      description: "CSS height, e.g. 'auto', '200px', '16rem'",
    }),
    rounded: z
      .enum(["none", "sm", "md", "lg", "full"])
      .default("md")
      .meta({ description: "Border radius: none, sm, md, lg, full (circle)" }),
    objectFit: z
      .enum(["cover", "contain", "fill", "none"])
      .default("cover")
      .meta({ description: "How the image fits its container" }),
  }),
  callbacks: {
    onClick: onClickSchema,
  },
});
