import { type StandardTool, standardTool } from "standard-tool";
import { z } from "zod";

const throwOnError = <T>(result: T | Error): T => {
  if (result instanceof Error) throw result;
  return result;
};

const NodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  x: z.number(),
  y: z.number(),
});

/**
 * The board's host function: arrange the given nodes evenly around a circle and
 * return them with updated positions. The "Auto-arrange" button `await`s this
 * and writes the laid-out nodes back into `scopes.root.nodes`.
 */
const autoLayout = standardTool({
  name: "autoLayout",
  description:
    "Arrange the given nodes evenly around a circle; returns them with updated x/y (0..1).",
  inputSchema: z.object({ nodes: z.array(NodeSchema) }),
  formatOutput: throwOnError,
  async execute({ nodes }) {
    const n = nodes.length || 1;
    return nodes.map((node, i) => {
      const a = (i / n) * Math.PI * 2 - Math.PI / 2;
      return {
        id: node.id,
        label: node.label,
        x: Math.round((0.5 + 0.34 * Math.cos(a)) * 1000) / 1000,
        y: Math.round((0.5 + 0.34 * Math.sin(a)) * 1000) / 1000,
      };
    });
  },
});

export const boardFunctions: StandardTool[] = [autoLayout];
