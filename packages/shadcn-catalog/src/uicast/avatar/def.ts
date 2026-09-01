import z from "zod";
import { createComponentDefinition } from "@uicast/core";
import { mouseEventSchema } from "../../events/mouse";

export const AvatarDef = createComponentDefinition({
  name: "Avatar",
  description:
    "A circular avatar component for displaying user profile images or initials. Shows an image if 'src' is provided, otherwise falls back to showing initials from the 'fallback' text. Use Avatar for user profiles, comment authors, team member lists, etc.",
  props: z.object({
    src: z.string().optional().meta({
      format: "uri-reference",
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
    onClick: mouseEventSchema,
  },
});
