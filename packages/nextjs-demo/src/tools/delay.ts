import { standardTool } from "standard-tool";
import { z } from "zod";

// The "Slow seeds" page waits on it to show skeletons. It is not in `domainTools`, so the prompt never lists it.
export const delay = standardTool({
  name: "delay",
  description: "Resolves with `value` after `ms` milliseconds.",
  inputSchema: z.object({ ms: z.number().int().min(0).max(10_000), value: z.unknown().optional() }),
  outputSchema: z.unknown(),
  execute: ({ ms, value }) => new Promise((resolve) => setTimeout(() => resolve(value ?? null), ms)),
});
