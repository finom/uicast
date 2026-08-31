import { type StandardToolV0, standardTool } from "standard-tool";
import { z } from "zod";

/**
 * The studio's single host function — proof that a callback can `await` a host
 * call and write its result into scope. Returns a fresh random pattern grid;
 * the "Randomize" button's callback sets `scopes.root.pattern` to the result.
 */
const randomizePattern = standardTool({
  name: "randomizePattern",
  description: "Return a fresh random on/off pattern grid of the given size.",
  inputSchema: z.object({ tracks: z.number(), steps: z.number() }),
  outputSchema: z.array(z.array(z.boolean())),
  async execute({ tracks, steps }): Promise<boolean[][]> {
    return Array.from({ length: tracks }, () =>
      Array.from({ length: steps }, () => Math.random() < 0.32),
    );
  },
});

export const studioFunctions: StandardToolV0[] = [randomizePattern];
