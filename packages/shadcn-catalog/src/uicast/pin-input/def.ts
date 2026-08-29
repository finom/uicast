import z from "zod";
import { createComponentDefinition } from "@uicast/core";
import { keyboardEventSchema } from "../../events/keyboard";

export const PinInputDef = createComponentDefinition({
  name: "PinInput",
  description:
    "A verification/OTP code entry with segmented digit inputs. Renders a row of individual character inputs. Use PinInput for two-factor authentication, verification codes, or OTP entry.",
  props: z.object({
    value: z.string().default("").meta({
      description: "The current pin value",
    }),
    length: z.number().default(6).meta({
      description: "Number of digits/characters in the pin",
    }),
    mask: z.boolean().default(false).meta({
      description:
        "Whether to mask the input (show dots instead of characters)",
    }),
    disabled: z.boolean().default(false).meta({
      description: "Whether the input is disabled",
    }),
    type: z.enum(["numeric", "alphanumeric"]).default("numeric").meta({
      description: "Type of characters allowed",
    }),
  }),
  callbacks: {
    onKeyDown: keyboardEventSchema,
    onKeyUp: keyboardEventSchema,
    onChange: z.object({
      value: z.string().meta({ description: "The current pin value" }),
    }),
    onComplete: z.object({
      value: z.string().meta({ description: "The complete pin value" }),
    }),
  },
});
