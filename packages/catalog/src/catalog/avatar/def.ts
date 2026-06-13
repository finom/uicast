import z from "zod";
import { createComponentDefinition } from "@ui-fired/core/render/create-component-definition";
import { onClickSchema } from "@ui-fired/catalog/render/shared";

export const AvatarDef = createComponentDefinition({
  name: "Avatar",
  description:
    "A circular avatar component for displaying user profile images or initials. Shows an image if 'src' is provided, otherwise falls back to showing initials from the 'fallback' text. Use Avatar for user profiles, comment authors, team member lists, etc.",
  props: z.strictObject({
    src: z.string().optional().meta({
      description: "URL of the avatar image",
    }),
    fallback: z.string().default("?").meta({
      description:
        "Fallback text shown when no image is available (typically initials like 'JD')",
    }),
    size: z.enum(["sm", "md", "lg", "xl"]).default("md").meta({
      description: "Avatar size: sm (32px), md (40px), lg (48px), xl (64px)",
    }),
  }),
  callbacks: {
    onClick: onClickSchema,
  },
});
