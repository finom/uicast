import z from "zod";
import { createComponentDefinition } from "@ui-fired/core/def/create-component-definition";

export const AvatarGroupDef = createComponentDefinition({
  name: "AvatarGroup",
  description:
    "Stacked/overlapping avatar cluster with +N overflow. Renders a row of overlapping avatar circles. Use AvatarGroup for team member displays, assignee lists, participant counts, etc.",
  props: z.strictObject({
    avatars: z
      .array(
        z.object({
          src: z.string().optional().meta({ description: "Avatar image URL" }),
          alt: z.string().optional().meta({ description: "Alt text" }),
          fallback: z
            .string()
            .optional()
            .meta({ description: "Fallback text (initials)" }),
        }),
      )
      .meta({ description: "Array of avatar data" }),
    max: z.number().default(5).meta({
      description: "Maximum number of avatars to show before +N overflow",
    }),
    size: z.enum(["sm", "default", "lg"]).default("default").meta({
      description: "Avatar size",
    }),
  }),
});
