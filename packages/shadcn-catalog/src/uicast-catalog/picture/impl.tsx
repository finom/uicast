import { createComponentImplementation } from "@uicast/react";
import { Skeleton } from "../../components/ui/skeleton";
import { pickMouseEvent } from "../../events/mouse";
import { PictureDef } from "./def";
import { height as toHeight, width as toWidth } from "../../lib/sizes";

export const PictureImpl = createComponentImplementation({
  def: PictureDef,
  render: ({
    src,
    alt,
    width,
    height,
    rounded,
    objectFit,
    onClick,
  }, { entry }) => {
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
        style={{ width: toWidth(width ?? "full"), height: toHeight(height ?? "auto") }}
        onClick={(e) => onClick(pickMouseEvent(e))}
        data-key={entry.key}
      />
    );
  },
  skeleton: () => <Skeleton className="w-full" style={{ height: 200 }} />,
});
