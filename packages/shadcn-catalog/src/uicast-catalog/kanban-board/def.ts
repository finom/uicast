import z from "zod";
import { createComponentDefinition } from "@uicast/core";
import { chartColorSchema } from "../../lib/chart-colors";

const cardSchema = z.strictObject({
  id: z.string().meta({ description: "Card unique identifier (unique across the whole board)" }),
  title: z.string().meta({ description: "Card title" }),
  description: z
    .string()
    .optional()
    .meta({ description: "Card description" }),
  tag: z
    .string()
    .optional()
    .meta({ description: "Optional tag/label" }),
  tagColor: chartColorSchema.optional().meta({ description: "Tag background colour." }),
});

const columnSchema = z.strictObject({
  id: z.string().meta({ description: "Column unique identifier" }),
  title: z.string().meta({ description: "Column header title" }),
  cards: z.array(cardSchema).meta({ description: "Array of cards in this column" }),
});

export type KanbanCard = z.infer<typeof cardSchema>;
export type KanbanColumn = z.infer<typeof columnSchema>;

export const KanbanBoardDef = createComponentDefinition({
  name: "KanbanBoard",
  description:
    "A Kanban-style board of columns and cards with drag-and-drop: cards can be dragged within a column and between columns, and are also clickable. Use KanbanBoard for project management, task tracking, pipeline workflows, or any column-based workflow.",
  props: z.strictObject({
    columns: z
      .array(columnSchema)
      .meta({ description: "Array of column definitions with their cards" }),
  }),
  callbacks: {
    onCardClick: z
      .strictObject({
        cardId: z.string().meta({ description: "Clicked card ID" }),
        columnId: z.string().meta({ description: "Column the card is in" }),
      })
      .meta({ description: "Callback when a card is clicked" }),
    onCardMove: z
      .strictObject({
        cardId: z.string().meta({ description: "The moved card's ID" }),
        fromColumnId: z.string().meta({ description: "Column the card was dragged from" }),
        toColumnId: z.string().meta({ description: "Column the card was dropped into" }),
        toIndex: z
          .number().int().nonnegative()
          .meta({ description: "The card's new index within the target column" }),
        columns: z.array(columnSchema).meta({
          description: "The complete board state after the move, same shape as the `columns` prop",
        }),
      })
      .meta({
        description:
          "Fires when a card is dropped in a new position. Write `evt.columns` back to the state path that feeds the `columns` prop (e.g. a `set` step assigning `evt.columns`) so the board and any other elements reading that state stay in sync; use the other fields to persist the move.",
      }),
  },
});
