import { QRCodeSVG } from "qrcode.react";
import { createComponentImplementation } from "@uicast/react";
import { Skeleton } from "../../components/ui/skeleton";
import { Card, CardContent } from "../../components/ui/card";
import { QRCodeDef } from "./def";

const SWATCH = { white: "#ffffff", black: "#000000" } as const;

// Rendered locally: a hot-linked image service would ship the value in the URL.
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
  skeleton: () => <Skeleton className="w-full" style={{ height: 160 }} />,
});
