import { createComponentImplementation } from "@uicast/react";
import { buttonVariants } from "../../components/ui/button";
import { cn } from "../../lib/utils";
import { ExternalLink } from "lucide-react";
import { LinkDef } from "./def";

export const LinkImpl = createComponentImplementation({
  def: LinkDef,
  render: ({ text, children, href, variant, size, underline, external }, { entry }) => (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className={cn(
        buttonVariants({ variant: "link", size }),
        "inline-flex items-center gap-1",
        variant === "muted" && "text-muted-foreground",
        variant === "destructive" && "text-destructive",
        size === "lg" && "text-base",
        underline === "always" && "underline",
        underline === "none" && "hover:no-underline",
      )}
      data-key={entry.key}
    >
      {children ?? text}
      {external && <ExternalLink className="size-3" />}
    </a>
  ),
});
