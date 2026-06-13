import z from "zod";
import { createComponentDefinition } from "@ui-fired/core/render/create-component-definition";

export const SparklineDef = createComponentDefinition({
  name: "Sparkline",
  description:
    "A tiny inline chart for embedding within text or table cells. Renders a small line sparkline without axes or labels. Use Sparkline for dashboard metrics, table cell trends, inline data visualization, stock tickers, etc.",
  props: z.strictObject({
    data: z.array(z.number()).meta({
      description: "Array of numeric values to plot, e.g. [10, 23, 45, 12, 50]",
    }),
    width: z
      .number()
      .default(100)
      .meta({ description: "Sparkline width in pixels" }),
    height: z
      .number()
      .default(30)
      .meta({ description: "Sparkline height in pixels" }),
    color: z.string().default("#8884d8").meta({ description: "Line color" }),
    filled: z
      .boolean()
      .default(false)
      .meta({ description: "Whether to fill under the line" }),
  }),
});
