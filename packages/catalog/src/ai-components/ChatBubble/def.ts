import z from "zod";
import { createAIComponentDef } from "ui-fired/core/render/createAIComponentDef";

export const ChatBubbleDef = createAIComponentDef({
  name: "ChatBubble",
  description:
    "A chat message bubble for messaging interfaces. Renders a styled message bubble with sender info and timestamp. Use ChatBubble for chat UIs, customer support widgets, AI conversation displays, or any messaging interface.",
  props: z.strictObject({
    messages: z
      .array(
        z.object({
          id: z.string().meta({ description: "Message unique identifier" }),
          content: z.string().meta({ description: "Message text content" }),
          sender: z.string().meta({ description: "Sender name" }),
          avatar: z
            .string()
            .optional()
            .meta({ description: "Sender avatar URL" }),
          timestamp: z
            .string()
            .optional()
            .meta({ description: "Message timestamp text" }),
          isOwn: z
            .boolean()
            .optional()
            .meta({ description: "Whether this is from the current user" }),
        }),
      )
      .meta({ description: "Array of chat messages" }),
  }),
  callbacks: {
    onMessageClick: z
      .object({
        id: z.string().meta({ description: "Clicked message ID" }),
      })
      .meta({ description: "Callback when a message is clicked" }),
  },
});
