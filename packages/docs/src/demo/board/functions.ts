import { type StandardToolV0, standardTool } from "standard-tool";
import { z } from "zod";

const CIRCLE_RADIUS = 0.34;

const NodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  x: z.number(),
  y: z.number(),
});

const autoLayout = standardTool({
  name: "autoLayout",
  description:
    "Arrange the given nodes evenly around a circle; returns them with updated x/y (0..1).",
  inputSchema: z.object({ nodes: z.array(NodeSchema) }),
  outputSchema: z.array(NodeSchema),
  async execute({ nodes }) {
    const n = nodes.length;
    return nodes.map((node, i) => {
      const a = (i / n) * Math.PI * 2 - Math.PI / 2;
      return {
        id: node.id,
        label: node.label,
        x: Math.round((0.5 + CIRCLE_RADIUS * Math.cos(a)) * 1000) / 1000,
        y: Math.round((0.5 + CIRCLE_RADIUS * Math.sin(a)) * 1000) / 1000,
      };
    });
  },
});

export const boardFunctions: StandardToolV0[] = [autoLayout];
