import { type StandardTool, standardTool } from "standard-tool";
import { z } from "zod";

// Re-throw on error so a failed call surfaces loudly in the live UI rather than
// being swallowed into standard-tool's default `{ error }` envelope.
const throwOnError = <T>(result: T | Error): T => {
  if (result instanceof Error) throw result;
  return result;
};

/**
 * The studio's single host function — proof that a callback can `await` a host
 * call and write its result into scope. Returns a fresh random pattern grid;
 * the "Randomize" button's callback sets `scopes.root.pattern` to the result.
 */
const randomizePattern = standardTool({
  name: "randomizePattern",
  description: "Return a fresh random on/off pattern grid of the given size.",
  inputSchema: z.object({ tracks: z.number(), steps: z.number() }),
  formatOutput: throwOnError,
  async execute({ tracks, steps }): Promise<boolean[][]> {
    return Array.from({ length: tracks }, () =>
      Array.from({ length: steps }, () => Math.random() < 0.32),
    );
  },
});

export const studioFunctions: StandardTool[] = [randomizePattern];
