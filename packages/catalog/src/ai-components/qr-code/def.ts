import z from "zod";
import { createAIComponentDef } from "@ui-fired/core/render/create-ai-component-def";

export const QRCodeDef = createAIComponentDef({
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
