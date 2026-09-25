import { createComponentImplementation } from "@uicast/react";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
import { RowSkeleton } from "../../lib/skeletons";
import { cn } from "../../lib/utils";
import { AvatarGroupDef } from "./def";

const SIZES = { sm: "h-7 w-7 text-xs", default: "h-9 w-9 text-sm", lg: "h-12 w-12 text-base" };

export const AvatarGroupImpl = createComponentImplementation({
  def: AvatarGroupDef,
  render: ({ avatars, max, size }, { entry }) => {
    const overflow = avatars.length - max;
    const avatarClass = cn(SIZES[size], "border-2 border-background");
    return (
      <div className="flex -space-x-2" data-key={entry.key}>
        {avatars.slice(0, max).map((avatar, i) => (
          <Avatar key={i} className={avatarClass}>
            {avatar.src && <AvatarImage src={avatar.src} alt={avatar.alt} />}
            <AvatarFallback className="text-xs">{avatar.fallback ?? avatar.alt?.charAt(0) ?? "?"}</AvatarFallback>
          </Avatar>
        ))}
        {overflow > 0 && (
          <Avatar className={avatarClass}>
            <AvatarFallback className="bg-muted text-muted-foreground text-xs">+{overflow}</AvatarFallback>
          </Avatar>
        )}
      </div>
    );
  },
  skeleton: RowSkeleton,
});
