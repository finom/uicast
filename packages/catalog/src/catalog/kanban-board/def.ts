import z from "zod";
import { createComponentDefinition } from "@ui-fired/core/def/create-component-definition";

export const KanbanBoardDef = createComponentDefinition({
  name: "KanbanBoard",
  description:
    "A Kanban-style board with draggable columns and cards. Renders a horizontal set of columns each containing cards. Use KanbanBoard for project management, task tracking, pipeline workflows, or any column-based workflow.",
  props: z.strictObject({
    columns: z
      .array(
        z.object({
          id: z.string().meta({ description: "Column unique identifier" }),
          title: z.string().meta({ description: "Column header title" }),
          cards: z
            .array(
              z.object({
                id: z.string().meta({ description: "Card unique identifier" }),
                title: z.string().meta({ description: "Card title" }),
                description: z
                  .string()
                  .optional()
                  .meta({ description: "Card description" }),
                tag: z
                  .string()
                  .optional()
                  .meta({ description: "Optional tag/label" }),
                tagColor: z
                  .string()
                  .optional()
                  .meta({ description: "Tag background color" }),
              }),
            )
            .meta({ description: "Array of cards in this column" }),
        }),
      )
      .meta({ description: "Array of column definitions with their cards" }),
  }),
  callbacks: {
    onCardClick: z
      .object({
        cardId: z.string().meta({ description: "Clicked card ID" }),
        columnId: z.string().meta({ description: "Column the card is in" }),
      })
      .meta({ description: "Callback when a card is clicked" }),
  },
});
