import z from "zod";
import { createAIComponentDef } from "@ui-fired/core/render/createAIComponentDef";

export const TreeViewDef = createAIComponentDef({
  name: "TreeView",
  description:
    "A hierarchical expandable list for file systems, org trees, or category browsing. Renders a tree structure with expandable/collapsible nodes. Use TreeView for file explorers, organization charts, category navigation, etc.",
  props: z.strictObject({
    items: z
      .array(
        z.object({
          label: z.string().meta({ description: "Node label text" }),
          icon: z.string().optional().meta({ description: "Lucide icon name" }),
          expanded: z
            .boolean()
            .optional()
            .meta({ description: "Whether the node is expanded" }),
          children: z
            .array(
              z.object({
                label: z.string().meta({ description: "Child node label" }),
                icon: z
                  .string()
                  .optional()
                  .meta({ description: "Lucide icon name" }),
                children: z
                  .array(z.any())
                  .optional()
                  .meta({ description: "Nested children" }),
              }),
            )
            .optional()
            .meta({ description: "Child nodes" }),
        }),
      )
      .meta({ description: "Array of root-level tree nodes" }),
  }),
  callbacks: {
    onSelect: z
      .object({
        label: z
          .string()
          .meta({ description: "The label of the selected node" }),
        path: z
          .array(z.string())
          .meta({ description: "The path from root to selected node" }),
      })
      .meta({ description: "Callback when a tree node is selected" }),
    onToggle: z
      .object({
        label: z
          .string()
          .meta({ description: "The label of the toggled node" }),
        expanded: z.boolean().meta({ description: "The new expanded state" }),
      })
      .meta({ description: "Callback when a tree node is expanded/collapsed" }),
  },
});
