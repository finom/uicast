import { createComponentDefinition } from "@ui-fired/core/render/create-component-definition";
import z from "zod";

/**
 * Bespoke board component with TWO custom events of different shapes:
 * `onMoveNode` is *spatial* ({ id, x, y }), `onConnect` is *relational*
 * ({ from, to }). One component, two payload shapes — both flowing through the
 * same declarative callback mechanism.
 */
export const NodeBoardDef = createComponentDefinition({
  name: "NodeBoard",
  description:
    "A free-form board of draggable nodes with connection wires. Dragging a node emits { id, x, y } (0..1 fractions of the board); clicking one node's port then another's emits { from, to } node ids.",
  props: z.strictObject({
    nodes: z
      .array(
        z.object({
          id: z.string().meta({ description: "Node id" }),
          label: z.string().meta({ description: "Node label" }),
          x: z.number().meta({ description: "X position, 0..1" }),
          y: z.number().meta({ description: "Y position, 0..1" }),
        }),
      )
      .meta({ description: "Nodes on the board" }),
    links: z
      .array(
        z.object({
          from: z.string().meta({ description: "Source node id" }),
          to: z.string().meta({ description: "Target node id" }),
        }),
      )
      .meta({ description: "Connections between nodes" }),
  }),
  callbacks: {
    onMoveNode: z.strictObject({
      id: z.string().meta({ description: "The dragged node's id" }),
      x: z.number().meta({ description: "New X, 0..1" }),
      y: z.number().meta({ description: "New Y, 0..1" }),
    }),
    onConnect: z.strictObject({
      from: z.string().meta({ description: "Source node id" }),
      to: z.string().meta({ description: "Target node id" }),
    }),
  },
});
