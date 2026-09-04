import z from "zod";
import { createComponentDefinition } from "@uicast/core";
import { filterOperatorSchema } from "../../lib/filter-operators";

// One condition. The same shape goes in as a prop and comes back on apply.
const filterSchema = z
  .strictObject({
    field: z.string().meta({ description: "Which field the condition is on, by `name`." }),
    operator: filterOperatorSchema.meta({ description: "How to compare." }),
    value: z.string().meta({ description: "The value compared against." }),
  })
  .meta({ id: "Filter" });

export type Filter = z.infer<typeof filterSchema>;

export const FilterBuilderDef = createComponentDefinition({
  name: "FilterBuilder",
  description:
    "A dynamic filter/query builder for constructing conditions. Renders rows of field/operator/value filters that users can add/remove. Use FilterBuilder for data filtering, report criteria, advanced search, or query composition.",
  props: z.strictObject({
    fields: z
      .array(
        z.strictObject({
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
      .array(filterSchema)
      .optional()
      .meta({ description: "Current applied filters" }),
  }),
  callbacks: {
    onApply: z
      .strictObject({
        filters: z.array(filterSchema).meta({ description: "The applied filters" }),
      })
      .meta({ description: "Callback when filters are applied" }),
  },
});
