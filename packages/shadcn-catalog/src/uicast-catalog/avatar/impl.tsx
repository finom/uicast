import { createComponentImplementation } from "@uicast/react";
import { AvatarFallback, AvatarImage, Avatar as ShadcnAvatar } from "../../components/ui/avatar";
import { pickMouseEvent } from "../../events/mouse";
import { cn } from "../../lib/utils";
import { AvatarDef } from "./def";

const SIZES = { sm: "size-8", md: "size-10", lg: "size-12", xl: "size-16" };
const TEXT_SIZES = { sm: "text-xs", md: "text-sm", lg: "text-base", xl: "text-lg" };

export const AvatarImpl = createComponentImplementation({
  def: AvatarDef,
  render: ({ src, fallback, size, onClick }, { entry }) => (
    <ShadcnAvatar
      className={cn(SIZES[size], entry.callbacks?.onClick && "cursor-pointer")}
      onClick={(e) => onClick(pickMouseEvent(e))}
      data-key={entry.key}
    >
      {src && <AvatarImage src={src} alt={fallback} />}
      <AvatarFallback className={TEXT_SIZES[size]}>{fallback.slice(0, 2).toUpperCase()}</AvatarFallback>
    </ShadcnAvatar>
  ),
});
