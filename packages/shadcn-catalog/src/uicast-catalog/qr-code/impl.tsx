import { QRCodeSVG } from "qrcode.react";
import { createComponentImplementation } from "@uicast/react";
import { blockSkeleton } from "../../lib/skeletons";
import { QRCodeDef } from "./def";

const SWATCH = { white: "#ffffff", black: "#000000" } as const;

// Rendered locally: a hot-linked image service would ship the value in the URL.
export const QRCodeImpl = createComponentImplementation({
  def: QRCodeDef,
  render: ({ value, size, bgColor, fgColor }, { entry }) => (
    // The margin is the quiet zone a scanner needs around the code.
    <div className="inline-block overflow-hidden rounded-lg border" data-key={entry.key}>
      <QRCodeSVG
        value={value}
        size={size}
        bgColor={SWATCH[bgColor]}
        fgColor={SWATCH[fgColor]}
        marginSize={4}
        title={`QR code: ${value}`}
        className="block"
      />
    </div>
  ),
  skeleton: blockSkeleton(160),
});
