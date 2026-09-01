import z from "zod";
import { createComponentDefinition } from "@uicast/core";

export const MapDef = createComponentDefinition({
  name: "Map",
  description:
    "A static map display with markers. Renders an embedded map image with optional pin markers. Use Map for store locators, delivery tracking, contact pages, or any location display. Uses a static map image approach.",
  props: z.strictObject({
    center: z
      .object({
        lat: z.number().meta({ description: "Latitude" }),
        lng: z.number().meta({ description: "Longitude" }),
      })
      .meta({ description: "Map center coordinates" }),
    zoom: z.number().default(13).meta({
      description:
        "Zoom level (1-20). Only scales overlay marker placement — the embedded map always shows a fixed area around the center",
    }),
    markers: z
      .array(
        z.strictObject({
          lat: z.number().meta({ description: "Marker latitude" }),
          lng: z.number().meta({ description: "Marker longitude" }),
          label: z.string().optional().meta({ description: "Marker label" }),
        }),
      )
      .optional()
      .meta({ description: "Array of map markers" }),
    width: z.number().default(600).meta({ description: "Map width in pixels" }),
    height: z
      .number()
      .default(400)
      .meta({ description: "Map height in pixels" }),
  }),
  callbacks: {
    onMarkerClick: z
      .object({
        lat: z.number().meta({ description: "Marker latitude" }),
        lng: z.number().meta({ description: "Marker longitude" }),
        label: z.string().optional().meta({ description: "Marker label" }),
      })
      .meta({ description: "Callback when a marker is clicked" }),
  },
});
