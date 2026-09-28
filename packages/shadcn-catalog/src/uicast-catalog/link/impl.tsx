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
        // A button's box, minus the width a flex column stretches and the side padding that indents the text.
        "inline-flex w-fit items-center gap-1 px-0",
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
