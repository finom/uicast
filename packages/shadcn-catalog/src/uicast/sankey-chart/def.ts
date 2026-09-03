import z from "zod";
import { createComponentDefinition } from "@uicast/core";

export const SankeyChartDef = createComponentDefinition({
  name: "SankeyChart",
  description:
    "A Sankey diagram for flow/relationship visualization between nodes. Shows how values flow between source and target nodes. Use SankeyChart for user flow, budget allocation, energy flow, conversion funnels, etc.",
  props: z.strictObject({
    nodes: z
      .array(
        z.strictObject({
          name: z.string().meta({ description: "Node name" }),
        }),
      )
      .meta({ description: "Array of node definitions" }),
    links: z
      .array(
        z.strictObject({
          source: z.number().int().nonnegative().meta({ description: "Source node index" }),
          target: z.number().int().nonnegative().meta({ description: "Target node index" }),
          value: z.number().meta({ description: "Flow value/weight" }),
        }),
      )
      .meta({ description: "Array of links between nodes" }),
    height: z
      .number().int().positive()
      .default(400)
      .meta({ description: "Chart height in pixels" }),
  }),
});
