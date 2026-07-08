import { createComponentImplementation } from "@ui-fired/react";
import { pickMouseEvent } from "../../events/mouse";
import { ImageDef } from "./def";

export const ImageImpl = createComponentImplementation({
  def: ImageDef,
  render: ({
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
      <img
        src={src}
        alt={alt}
        className={`${radiusMap[rounded]} ${fitMap[objectFit]}`}
        style={{ width: width ?? "100%", height: height ?? "auto" }}
        onClick={(e) => onClick?.(pickMouseEvent(e))}
        data-key={generatedKey}
      />
    );
  },
});
