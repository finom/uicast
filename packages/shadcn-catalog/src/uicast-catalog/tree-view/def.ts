import z from "zod";
import { createComponentDefinition } from "@uicast/core";
import { type IconName, iconNameSchema } from "../../lib/icons";

// The explicit type is what `z.lazy` needs.
export type TreeNode = {
  label: string;
  icon?: IconName;
  expanded?: boolean;
  children?: TreeNode[];
};

const treeNode: z.ZodType<TreeNode> = z
  .lazy(() =>
    z.strictObject({
      label: z.string().meta({ description: "Node label." }),
      icon: iconNameSchema.optional().meta({ description: "Optional icon for this node." }),
      expanded: z.boolean().optional().meta({ description: "Whether the node starts expanded." }),
      children: z.array(treeNode).optional().meta({ description: "Nested nodes." }),
    }),
  )
  .meta({ id: "TreeNode" });

export const TreeViewDef = createComponentDefinition({
  name: "TreeView",
  description:
    "A hierarchical expandable list for file systems, org trees, or category browsing. Renders a tree structure with expandable/collapsible nodes. Use TreeView for file explorers, organization charts, category navigation, etc.",
  props: z.strictObject({
    items: z.array(treeNode).meta({ description: "Root-level nodes." }),
  }),
  callbacks: {
    onSelect: z
      .strictObject({
        label: z.string().meta({ description: "The label of the selected node" }),
        path: z.array(z.string()).meta({ description: "The path from root to selected node" }),
      })
      .meta({ description: "Callback when a tree node is selected" }),
    onToggle: z
      .strictObject({
        label: z.string().meta({ description: "The label of the toggled node" }),
        expanded: z.boolean().meta({ description: "The new expanded state" }),
      })
      .meta({ description: "Callback when a tree node is expanded/collapsed" }),
  },
});
