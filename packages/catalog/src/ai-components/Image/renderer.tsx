import { createAIComponentRenderer } from "@ui-fired/react";
import { pickClick } from "@ui-fired/catalog/render/shared";
import { ImageDef } from "./def";

export const ImageRenderer = createAIComponentRenderer({
  def: ImageDef,
  renderer: ({
    src,
    alt = "",
    width,
    height,
    rounded = "md",
    objectFit = "cover",
    onClick,
    generatedKey,
  }) => {
    const radiusMap: Record<string, string> = {
      none: "rounded-none",
      sm: "rounded-sm",
      md: "rounded-md",
      lg: "rounded-lg",
      full: "rounded-full",
    };
    const fitMap: Record<string, string> = {
      cover: "object-cover",
      contain: "object-contain",
      fill: "object-fill",
      none: "object-none",
    };
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        className={`${radiusMap[rounded]} ${fitMap[objectFit]}`}
        style={{ width: width ?? "100%", height: height ?? "auto" }}
        onClick={(e) => onClick?.(pickClick(e))}
        data-key={generatedKey}
      />
    );
  },
});
