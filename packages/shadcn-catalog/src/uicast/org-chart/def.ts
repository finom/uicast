import z from "zod";
import { createComponentDefinition } from "@uicast/core";

// Recursive: reports are nodes, to any depth. The explicit type is what `z.lazy` needs to infer.
export type OrgNode = {
  name: string;
  title?: string;
  avatar?: string;
  children?: OrgNode[];
};

const orgNode: z.ZodType<OrgNode> = z
  .lazy(() =>
    z.strictObject({
      name: z.string().meta({ description: "Person or role name." }),
      title: z.string().optional().meta({ description: "Job title." }),
      avatar: z.string().optional().meta({ format: "uri-reference", description: "Avatar image URL." }),
      children: z.array(orgNode).optional().meta({ description: "Direct reports." }),
    }),
  )
  .meta({ id: "OrgNode" });

export const OrgChartDef = createComponentDefinition({
  name: "OrgChart",
  description:
    "An organizational hierarchy chart. Renders a tree-like structure showing reporting relationships. Use OrgChart for company org charts, team structures, or any hierarchical people/role display.",
  props: z.strictObject({
    root: orgNode.meta({ description: "Root node of the chart." }),
  }),
  callbacks: {
    onNodeClick: z
      .strictObject({
        name: z.string().meta({ description: "Clicked person name" }),
        title: z.string().optional().meta({ description: "Job title" }),
      })
      .meta({ description: "Callback when a node is clicked" }),
  },
});
