import z from "zod";
import { createComponentDefinition } from "@uicast/core";

export const OrgChartDef = createComponentDefinition({
  name: "OrgChart",
  description:
    "An organizational hierarchy chart. Renders a tree-like structure showing reporting relationships. Use OrgChart for company org charts, team structures, or any hierarchical people/role display.",
  props: z.object({
    root: z
      .object({
        name: z.string().meta({ description: "Person/role name" }),
        title: z.string().optional().meta({ description: "Job title" }),
        avatar: z.string().optional().meta({ description: "Avatar image URL" }),
        children: z
          .array(z.any())
          .optional()
          .meta({ description: "Direct reports (same shape recursively)" }),
      })
      .meta({ description: "Root node of the org chart" }),
  }),
  callbacks: {
    onNodeClick: z
      .object({
        name: z.string().meta({ description: "Clicked person name" }),
        title: z.string().optional().meta({ description: "Job title" }),
      })
      .meta({ description: "Callback when a node is clicked" }),
  },
});
