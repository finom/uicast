import z from "zod";
import { createAIComponentDef } from "ui-fired/core/render/createAIComponentDef";

export const PageHeaderDef = createAIComponentDef({
  name: "PageHeader",
  description:
    "A title + description + actions bar pattern for page headers. Renders a structured header with primary title, optional subtitle, and an actions slot. Use PageHeader at the top of pages for consistent page titling.",
  props: z.strictObject({
    title: z.string().meta({
      description: "The page title text",
    }),
    description: z.string().optional().meta({
      description: "Optional subtitle/description text",
    }),
    breadcrumbs: z
      .array(
        z.object({
          label: z.string().meta({ description: "Breadcrumb label" }),
        }),
      )
      .optional()
      .meta({ description: "Optional breadcrumb items above the title" }),
  }),
  callbacks: {
    onBreadcrumbClick: z
      .object({
        index: z.number().meta({ description: "The clicked breadcrumb index" }),
        label: z.string().meta({ description: "The clicked breadcrumb label" }),
      })
      .meta({ description: "Callback when a breadcrumb is clicked" }),
  },
});
