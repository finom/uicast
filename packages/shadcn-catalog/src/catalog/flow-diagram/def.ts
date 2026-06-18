import z from "zod";
import { createComponentDefinition } from "@ui-fired/core";

export const FlowDiagramDef = createComponentDefinition({
  name: "FlowDiagram",
  description:
    "A simple flow diagram / process diagram. Renders connected nodes with arrows showing process flow. Use FlowDiagram for business processes, decision flows, pipeline visualization, or any step-by-step process.",
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
      .meta({ description: "Array of edges connecting nodes" }),
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
