import z from "zod";
import { createAIComponentDef } from "@ui-fired/core/render/create-ai-component-def";

export const BreadcrumbDef = createAIComponentDef({
  name: "Breadcrumb",
  description:
    "A breadcrumb navigation showing the current page's location within a hierarchy. Renders a horizontal trail of links separated by chevrons. Use Breadcrumb for page navigation hierarchy (Home > Products > Details) or wizard step indicators.",
  props: z.strictObject({
    items: z
      .array(
        z.object({
          label: z.string().meta({ description: "The breadcrumb item text" }),
          active: z.boolean().optional().meta({
            description:
              "Whether this is the current/active page (last item, rendered as plain text)",
          }),
        }),
      )
      .meta({ description: "Array of breadcrumb items in order" }),
  }),
  callbacks: {
    onNavigate: z
      .object({
        index: z.number().meta({
          description: "The zero-based index of the clicked breadcrumb item",
        }),
        label: z.string().meta({
          description: "The label of the clicked breadcrumb item",
        }),
      })
      .meta({
        description: "Callback when a breadcrumb link is clicked",
      }),
  },
});
