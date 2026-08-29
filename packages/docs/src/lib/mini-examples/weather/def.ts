import z from "zod";
import { createComponentDefinition } from "@uicast/core";

export const WeatherCardDef = createComponentDefinition({
  name: "WeatherCard",
  description: "Shows the weather for a selectable city.",
  props: z.object({
    city: z.string().meta({ description: "The selected city" }),
    tempC: z.number().optional().meta({ description: "Temperature, °C" }),
    condition: z.string().optional().meta({ description: "Sky condition" }),
  }),
  callbacks: {
    onCity: z
      .object({ city: z.string().meta({ description: "The newly picked city" }) })
      .meta({ description: "Fires when the user picks a city" }),
  },
});
