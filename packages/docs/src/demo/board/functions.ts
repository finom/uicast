import { type StandardToolV0, standardTool } from "standard-tool";
import { z } from "zod";

const CIRCLE_RADIUS = 0.34;
const round3 = (n: number) => Math.round(n * 1000) / 1000;

const NodeSchema = z.object({ id: z.string(), label: z.string(), x: z.number(), y: z.number() });

const autoLayout = standardTool({
  name: "autoLayout",
  description: "Arrange the given nodes evenly around a circle; returns them with updated x/y (0..1).",
  inputSchema: z.object({ nodes: z.array(NodeSchema) }),
  outputSchema: z.array(NodeSchema),
  async execute({ nodes }) {
    return nodes.map(({ id, label }, i) => {
      const a = (i / nodes.length) * Math.PI * 2 - Math.PI / 2;
      return { id, label, x: round3(0.5 + CIRCLE_RADIUS * Math.cos(a)), y: round3(0.5 + CIRCLE_RADIUS * Math.sin(a)) };
    });
  },
});

export const boardFunctions: StandardToolV0[] = [autoLayout];
