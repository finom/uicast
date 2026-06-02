import z from "zod";
import { createAIComponentDef } from "@ui-fired/core/render/createAIComponentDef";

export const SankeyChartDef = createAIComponentDef({
  name: "SankeyChart",
  description:
    "A Sankey diagram for flow/relationship visualization between nodes. Shows how values flow between source and target nodes. Use SankeyChart for user flow, budget allocation, energy flow, conversion funnels, etc.",
  props: z.strictObject({
    nodes: z
      .array(
        z.object({
          name: z.string().meta({ description: "Node name" }),
        }),
      )
      .meta({ description: "Array of node definitions" }),
    links: z
      .array(
        z.object({
          source: z.number().meta({ description: "Source node index" }),
          target: z.number().meta({ description: "Target node index" }),
          value: z.number().meta({ description: "Flow value/weight" }),
        }),
      )
      .meta({ description: "Array of links between nodes" }),
    height: z
      .number()
      .default(400)
      .meta({ description: "Chart height in pixels" }),
  }),
});
