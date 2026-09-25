import z from "zod";
import { createComponentDefinition } from "@uicast/core";

export const AlertDef = createComponentDefinition({
  name: "Alert",
  description:
    "A feedback alert banner for displaying important messages to the user. Shows an icon, title, and optional description. Use Alert for success messages, error notices, warnings, or informational banners.",
  props: z.strictObject({
    title: z.string().meta({ description: "The alert heading text" }),
    description: z.string().optional().meta({
      description: "Optional longer description text below the title",
    }),
    status: z.enum(["info", "success", "warning", "error"]).default("info").meta({
      description: "The alert type determining the icon; error is also shown in red (destructive)",
    }),
  }),
});
