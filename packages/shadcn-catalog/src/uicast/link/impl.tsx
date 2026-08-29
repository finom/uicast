import { createComponentImplementation } from "@uicast/react";
import { Button } from "../../components/ui/button";
import { cn } from "../../lib/utils";
import { ExternalLink } from "lucide-react";
import { LinkDef } from "./def";

export const LinkImpl = createComponentImplementation({
  def: LinkDef,
  render: ({
    text,
    children,
    href,
    variant,
    size,
    underline,
    external,
    disabled,
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
        onClick={() => onClick({ href })}
        data-key={generatedKey}
      >
        {children ?? text}
        {external && <ExternalLink className="size-3" />}
      </Button>
    );
  },
});
