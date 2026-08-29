import z from "zod";
import { createComponentDefinition } from "@uicast/core";

export const TrackPadDef = createComponentDefinition({
  name: "TrackPad",
  description: "A square surface that reports the pointer position while hovered.",
  props: z.object({
    x: z.number().optional().meta({ description: "Pointer x, in px from the left edge" }),
    y: z.number().optional().meta({ description: "Pointer y, in px from the top edge" }),
  }),
  callbacks: {
    onMove: z
      .object({
        x: z.number().meta({ description: "Pointer x inside the square" }),
        y: z.number().meta({ description: "Pointer y inside the square" }),
      })
      .meta({ description: "Fires on every pointer move over the square" }),
    onLeave: z.null().meta({ description: "Fires when the pointer leaves" }),
  },
});
