import z from "zod";
import { createComponentDefinition } from "@uicast/core";

export const ChatThreadDef = createComponentDefinition({
  name: "ChatThread",
  description:
    "A chat conversation thread for messaging interfaces. Renders a list of styled message bubbles with sender info and timestamps. Use ChatThread for chat UIs, customer support widgets, AI conversation displays, or any messaging interface.",
  props: z.strictObject({
    messages: z
      .array(
        z.strictObject({
          id: z.string().meta({ description: "Message unique identifier" }),
          content: z.string().meta({ description: "Message text content" }),
          sender: z.string().meta({ description: "Sender name" }),
          avatar: z
            .string()
            .optional()
            .meta({ format: "uri-reference", description: "Sender avatar URL" }),
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
      .strictObject({
        id: z.string().meta({ description: "Clicked message ID" }),
      })
      .meta({ description: "Callback when a message is clicked" }),
  },
});
