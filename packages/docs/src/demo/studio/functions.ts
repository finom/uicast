import { type StandardToolV0, standardTool } from "standard-tool";
import { z } from "zod";

const STEP_ON_CHANCE = 0.32;

const randomizePattern = standardTool({
  name: "randomizePattern",
  description: "Return a fresh random on/off pattern grid of the given size.",
  inputSchema: z.object({ tracks: z.number(), steps: z.number() }),
  outputSchema: z.array(z.array(z.boolean())),
  async execute({ tracks, steps }): Promise<boolean[][]> {
    return Array.from({ length: tracks }, () =>
      Array.from({ length: steps }, () => Math.random() < STEP_ON_CHANCE),
    );
  },
});

export const studioFunctions: StandardToolV0[] = [randomizePattern];
