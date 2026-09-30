import { standardTool } from "standard-tool";
import { z } from "zod";

// Expressions have no clock; a document takes the time from here, in a step.
export const now = standardTool({
  name: "now",
  description: "The current time: milliseconds since 1970-01-01 UTC.",
  outputSchema: z.number(),
  execute: () => Date.now(),
});
