import z from "zod";
import { createComponentDefinition } from "@uicast/core";
import { chartColorSchema } from "../../lib/chart-colors";

export const GanttChartDef = createComponentDefinition({
  name: "GanttChart",
  description:
    "A Gantt chart for project scheduling and task timeline visualization. Renders horizontal bars along a time axis. Use GanttChart for project planning, sprint timelines, event scheduling, or any time-based task visualization.",
  props: z.strictObject({
    tasks: z
      .array(
        z.strictObject({
          name: z.string().meta({ description: "Task name" }),
          start: z.number().int().nonnegative().meta({
            description: "Start position (e.g. day number or column index)",
          }),
          duration: z.number().int().positive().meta({ description: "Duration in the same unit as start" }),
          color: chartColorSchema.optional().meta({ description: "Optional task bar color." }),
          progress: z.number().min(0).max(100).optional().meta({
            description: "Optional progress percentage (0-100)",
          }),
        }),
      )
      .meta({ description: "Array of tasks with start and duration" }),
    totalUnits: z.number().int().positive().default(20).meta({
      description: "Total number of time units on the x-axis",
    }),
  }),
});
