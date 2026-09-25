import { createComponentImplementation } from "@uicast/react";
import { iconNode } from "../../lib/icon-node";
import { cn } from "../../lib/utils";
import { IconDef } from "./def";

const SIZES = { sm: "size-4", md: "size-5", lg: "size-6", xl: "size-8" } as const;
const COLORS = {
  default: "",
  muted: "text-muted-foreground",
  primary: "text-primary",
  destructive: "text-destructive",
  success: "text-green-600 dark:text-green-500",
  warning: "text-amber-600 dark:text-amber-500",
} as const;

export const IconImpl = createComponentImplementation({
  def: IconDef,
  render: ({ name, size, color }, { entry }) => (
    <span data-key={entry.key}>
      {iconNode(name, cn(SIZES[size], COLORS[color]))}
    </span>
  ),
});
