import z from "zod";
import { createComponentDefinition } from "uicast";

export const QRCodeDef = createComponentDefinition({
  name: "QRCode",
  description:
    "A QR code generation component. Renders a QR code from a given value. Use QRCode for sharing URLs, contact info, WiFi credentials, or any scannable data.",
  props: z.strictObject({
    value: z.string().meta({
      description: "The content to encode in the QR code",
    }),
    size: z.number().default(200).meta({
      description: "QR code size in pixels",
    }),
    bgColor: z.string().default("#ffffff").meta({
      description: "Background color",
    }),
    fgColor: z.string().default("#000000").meta({
      description: "Foreground (dot) color",
    }),
  }),
});
