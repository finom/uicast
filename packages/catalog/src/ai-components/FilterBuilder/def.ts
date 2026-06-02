import z from "zod";
import { createAIComponentDef } from "ui-fired/core/render/createAIComponentDef";

export const FilterBuilderDef = createAIComponentDef({
  name: "FilterBuilder",
  description:
    "A dynamic filter/query builder for constructing conditions. Renders rows of field/operator/value filters that users can add/remove. Use FilterBuilder for data filtering, report criteria, advanced search, or query composition.",
  props: z.strictObject({
    fields: z
      .array(
        z.object({
          name: z.string().meta({ description: "Field internal name" }),
          label: z.string().meta({ description: "Field display label" }),
          type: z.enum(["text", "number", "date", "select"]).meta({
            description: "Field type determining available operators and input",
          }),
          options: z.array(z.string()).optional().meta({
            description: "Options for select type fields",
          }),
        }),
      )
      .meta({ description: "Available fields to filter on" }),
    filters: z
      .array(
        z.object({
          field: z.string().meta({ description: "Selected field name" }),
          operator: z
            .string()
            .meta({ description: "Selected operator (e.g. equals, contains)" }),
          value: z.string().meta({ description: "Filter value" }),
        }),
      )
      .optional()
      .meta({ description: "Current applied filters" }),
  }),
  callbacks: {
    onApply: z
      .object({
        filters: z
          .array(
            z.object({
              field: z.string(),
              operator: z.string(),
              value: z.string(),
            }),
          )
          .meta({ description: "The applied filters" }),
      })
      .meta({ description: "Callback when filters are applied" }),
  },
});
