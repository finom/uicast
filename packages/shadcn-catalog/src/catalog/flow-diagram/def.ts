import z from "zod";
import { createComponentDefinition } from "uicast";

export const FlowDiagramDef = createComponentDefinition({
  name: "FlowDiagram",
  description:
    "A simple linear flow diagram. Renders the nodes in sequence with an arrow between consecutive steps — edges only toggle the arrow and its label, branching is not drawn. Use FlowDiagram for linear business processes, pipeline visualization, or any step-by-step sequence.",
  props: z.strictObject({
    nodes: z
      .array(
        z.object({
          id: z.string().meta({ description: "Node unique identifier" }),
          label: z.string().meta({ description: "Node label text" }),
          type: z
            .enum(["start", "end", "process", "decision"])
            .default("process")
            .meta({
              description: "Node shape type",
            }),
        }),
      )
      .meta({ description: "Array of flow nodes" }),
    edges: z
      .array(
        z.object({
          from: z.string().meta({ description: "Source node ID" }),
          to: z.string().meta({ description: "Target node ID" }),
          label: z
            .string()
            .optional()
            .meta({ description: "Optional edge label" }),
        }),
      )
      .meta({
        description:
          "Array of edges. A node's first outgoing edge shows the arrow (and optional label) after it in the sequence; edge targets do not reposition nodes",
      }),
    direction: z.enum(["horizontal", "vertical"]).default("vertical").meta({
      description: "Flow direction",
    }),
  }),
  callbacks: {
    onNodeClick: z
      .object({
        id: z.string().meta({ description: "Clicked node ID" }),
        label: z.string().meta({ description: "Node label" }),
      })
      .meta({ description: "Callback when a node is clicked" }),
  },
});
