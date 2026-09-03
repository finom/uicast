import { QRCodeSVG } from "qrcode.react";
import { createComponentImplementation } from "@uicast/react";
import { Card, CardContent } from "../../components/ui/card";
import { QRCodeDef } from "./def";

const SWATCH = { white: "#ffffff", black: "#000000" } as const;

// Rendered locally via qrcode.react — the encoded value never leaves the page
// (a hot-linked image service would ship it in the URL and break offline).
export const QRCodeImpl = createComponentImplementation({
  def: QRCodeDef,
  render: ({
    value,
    size,
    bgColor,
    fgColor,
  }, { entry }) => (
    <Card
      className="inline-flex items-center justify-center p-4"
      data-key={entry.key}
    >
      <CardContent className="p-0">
        <QRCodeSVG
          value={value}
          size={size}
          bgColor={SWATCH[bgColor]}
          fgColor={SWATCH[fgColor]}
          title={`QR code: ${value}`}
          className="rounded-sm"
        />
      </CardContent>
    </Card>
  ),
});
