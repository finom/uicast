import { createAIComponentRenderer } from "@ui-fired/react";
import { pickClick } from "@ui-fired/catalog/render/shared";
import {
  Avatar as ShadcnAvatar,
  AvatarImage,
  AvatarFallback,
} from "@ui-fired/catalog/components/ui/avatar";
import { AvatarDef } from "./def";

export const AvatarRenderer = createAIComponentRenderer({
  def: AvatarDef,
  renderer: ({ src, fallback = "?", size = "md", onClick, generatedKey }) => {
    const sizeMap: Record<string, string> = {
      sm: "size-8",
      md: "size-10",
      lg: "size-12",
      xl: "size-16",
    };
    const textSizeMap: Record<string, string> = {
      sm: "text-xs",
      md: "text-sm",
      lg: "text-base",
      xl: "text-lg",
    };
    return (
      <ShadcnAvatar
        className={`${sizeMap[size]} cursor-pointer`}
        onClick={(e) => onClick?.(pickClick(e))}
        data-key={generatedKey}
      >
        {src && <AvatarImage src={src} alt={fallback} />}
        <AvatarFallback className={textSizeMap[size]}>
          {fallback.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </ShadcnAvatar>
    );
  },
});
