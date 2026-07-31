import { QRCodeSVG } from "qrcode.react";
import { createComponentImplementation } from "@uicast/react";
import { Card, CardContent } from "../../components/ui/card";
import { QRCodeDef } from "./def";

// Rendered locally via qrcode.react — the encoded value never leaves the page
// (the previous implementation hot-linked a third-party image service, which
// shipped the value to it in the URL and broke offline).
export const QRCodeImpl = createComponentImplementation({
  def: QRCodeDef,
  render: ({
    value,
    size = 200,
    bgColor = "#ffffff",
    fgColor = "#000000",
    generatedKey,
  }) => (
    <Card
      className="inline-flex items-center justify-center p-4"
      data-key={generatedKey}
    >
      <CardContent className="p-0">
        <QRCodeSVG
          value={value}
          size={size}
          bgColor={bgColor}
          fgColor={fgColor}
          title={`QR code: ${value}`}
          className="rounded-sm"
        />
      </CardContent>
    </Card>
  ),
});
