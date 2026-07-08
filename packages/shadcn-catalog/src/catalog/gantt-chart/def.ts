import z from "zod";
import { createComponentDefinition } from "@ui-fired/core";

export const GanttChartDef = createComponentDefinition({
  name: "GanttChart",
  description:
    "A Gantt chart for project scheduling and task timeline visualization. Renders horizontal bars along a time axis. Use GanttChart for project planning, sprint timelines, event scheduling, or any time-based task visualization.",
  props: z.strictObject({
    tasks: z
      .array(
        z.object({
          name: z.string().meta({ description: "Task name" }),
          start: z.number().meta({
            description: "Start position (e.g. day number or column index)",
          }),
          duration: z
            .number()
            .meta({ description: "Duration in the same unit as start" }),
          color: z
            .string()
            .optional()
            .meta({ description: "Optional task bar color" }),
          progress: z.number().optional().meta({
            description: "Optional progress percentage (0-100)",
          }),
        }),
      )
      .meta({ description: "Array of tasks with start and duration" }),
    totalUnits: z.number().default(20).meta({
      description: "Total number of time units on the x-axis",
    }),
  }),
});
