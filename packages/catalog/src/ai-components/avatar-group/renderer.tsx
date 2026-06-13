import { createAIComponentRenderer } from "@ui-fired/react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@ui-fired/catalog/components/ui/avatar";
import { cn } from "@ui-fired/catalog/lib/utils";
import { AvatarGroupDef } from "./def";

export const AvatarGroupRenderer = createAIComponentRenderer({
  def: AvatarGroupDef,
  renderer: ({ avatars = [], max = 5, size = "default", generatedKey }) => {
    const visible = avatars.slice(0, max);
    const overflow = avatars.length - max;

    const sizeClasses = {
      sm: "h-7 w-7 text-xs",
      default: "h-9 w-9 text-sm",
      lg: "h-12 w-12 text-base",
    };

    return (
      <div className="flex -space-x-2" data-key={generatedKey}>
        {visible.map((avatar, i) => (
          <Avatar
            key={i}
            className={cn(sizeClasses[size], "border-2 border-background")}
          >
            {avatar.src && <AvatarImage src={avatar.src} alt={avatar.alt} />}
            <AvatarFallback className="text-xs">
              {avatar.fallback ?? avatar.alt?.charAt(0) ?? "?"}
            </AvatarFallback>
          </Avatar>
        ))}
        {overflow > 0 && (
          <Avatar
            className={cn(sizeClasses[size], "border-2 border-background")}
          >
            <AvatarFallback className="bg-muted text-muted-foreground text-xs">
              +{overflow}
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    );
  },
});
