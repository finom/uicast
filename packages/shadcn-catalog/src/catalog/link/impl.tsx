import { createComponentImplementation } from "@ui-fired/react";
import { Button } from "../../components/ui/button";
import { cn } from "../../lib/utils";
import { ExternalLink } from "lucide-react";
import { LinkDef } from "./def";

export const LinkImpl = createComponentImplementation({
  def: LinkDef,
  render: ({
    children,
    href,
    variant = "default",
    size = "default",
    underline = "hover",
    external = false,
    disabled = false,
    onClick,
    generatedKey,
  }) => {
    return (
      <Button
        variant="link"
        size={size === "lg" ? "lg" : size === "sm" ? "sm" : "default"}
        className={cn(
          "inline-flex items-center gap-1",
          variant === "default" && "text-primary",
          variant === "muted" && "text-muted-foreground",
          variant === "destructive" && "text-destructive",
          underline === "always" && "underline",
          underline === "hover" && "hover:underline no-underline",
          underline === "none" && "no-underline",
        )}
        disabled={disabled}
        onClick={() => onClick?.({ href })}
        data-key={generatedKey}
      >
        {children}
        {external && <ExternalLink className="size-3" />}
      </Button>
    );
  },
});
