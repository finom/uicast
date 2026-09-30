import { createComponentImplementation } from "@uicast/react";
import { pickMouseEvent } from "../../events/mouse";
import { height as toHeight, width as toWidth } from "../../lib/sizes";
import { BlockSkeleton } from "../../lib/skeletons";
import { PictureDef } from "./def";

const RADII = { none: "rounded-none", sm: "rounded-sm", md: "rounded-md", lg: "rounded-lg", full: "rounded-full" };
const FITS = { cover: "object-cover", contain: "object-contain", fill: "object-fill", none: "object-none" };

export const PictureImpl = createComponentImplementation({
  def: PictureDef,
  render: ({ src, alt, width, height, rounded, objectFit, onClick }, { entry }) => (
    <img
      src={src}
      alt={alt}
      className={`${RADII[rounded]} ${FITS[objectFit]}`}
      style={{ width: toWidth(width ?? "full"), height: toHeight(height ?? "auto") }}
      onClick={(e) => onClick(pickMouseEvent(e))}
      data-key={entry.key}
    />
  ),
  skeleton: () => <BlockSkeleton height={200} />,
});
