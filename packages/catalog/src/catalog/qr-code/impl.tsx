import { createComponentImplementation } from "@ui-fired/react";
import { Card, CardContent } from "@ui-fired/catalog/components/ui/card";
import { QRCodeDef } from "./def";

// Simple QR renderer via a third-party image service; swap in `qrcode.react` for real use.
export const QRCodeImpl = createComponentImplementation({
  def: QRCodeDef,
  render: ({
    value,
    size = 200,
    bgColor = "#ffffff",
    fgColor = "#000000",
    generatedKey,
  }) => {
    const encodedValue = encodeURIComponent(value);
    const src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedValue}&bgcolor=${bgColor.replace("#", "")}&color=${fgColor.replace("#", "")}`;

    return (
      <Card
        className="inline-flex items-center justify-center p-4"
        data-key={generatedKey}
      >
        <CardContent className="p-0">
          <img
            src={src}
            alt={`QR Code: ${value}`}
            width={size}
            height={size}
            className="rounded"
          />
        </CardContent>
      </Card>
    );
  },
});
