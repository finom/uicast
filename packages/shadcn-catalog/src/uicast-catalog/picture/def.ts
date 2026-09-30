import z from "zod";
import { createComponentDefinition } from "@uicast/core";
import { mouseEventSchema } from "../../events/mouse";
import { heightSchema, widthSchema } from "../../lib/sizes";

export const PictureDef = createComponentDefinition({
  name: "Picture",
  description:
    "An image component for displaying pictures, photos, or illustrations. Renders an img element with configurable sizing and rounded corners. Use Picture for product photos, user-uploaded images, hero banners, thumbnails, or any visual content.",
  props: z.strictObject({
    src: z.string().meta({
      format: "uri-reference",
      description: "The image URL/source",
    }),
    alt: z.string().meta({
      description:
        "What the image shows, read by screen readers and shown if it fails to load. Empty for a decorative image",
    }),
    width: widthSchema.optional().meta({ description: "Rendered width." }),
    height: heightSchema.optional().meta({ description: "Rendered height." }),
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
    onClick: mouseEventSchema,
  },
});
