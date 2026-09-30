import z from "zod";
import { createComponentDefinition } from "@uicast/core";
import { DEFAULT_ZOOM, MAX_ZOOM } from "./project";

// Bounds the tile count: a box this size takes at most 9 × 9 tiles.
const MAX_SIZE = 2048;

const markerSchema = z.strictObject({
  lat: z.number().min(-90).max(90).meta({ description: "Marker latitude" }),
  lng: z.number().min(-180).max(180).meta({ description: "Marker longitude" }),
  label: z.string().optional().meta({ description: "Shown on hover or focus" }),
  active: z.boolean().optional().meta({ description: "Highlights the pin and always shows its label" }),
});

export const LocationMapDef = createComponentDefinition({
  name: "LocationMap",
  description:
    "A map: map tiles in a `width` × `height` pixel box with a pin for each marker. Drag to pan; the + and − buttons or a double-click zoom. Hovering or focusing a pin shows its label, and an `active` pin shows it always; clicking a pin sends the marker to `onMarkerClick`. Without `center`, the map fits every marker. Use LocationMap for store locators, delivery tracking, contact pages, or any location display.",
  props: z.strictObject({
    center: z
      .strictObject({
        lat: z.number().min(-90).max(90).meta({ description: "Latitude" }),
        lng: z.number().min(-180).max(180).meta({ description: "Longitude" }),
      })
      .optional()
      .meta({ description: "The starting center. Without it, the map fits every marker" }),
    zoom: z
      .number()
      .int()
      .min(0)
      .max(MAX_ZOOM)
      .optional()
      .meta({
        description: `The starting zoom: 0 shows the whole world, 19 single buildings; each step doubles the scale. Without it, ${DEFAULT_ZOOM} around \`center\`, or the zoom that fits every marker`,
      }),
    markers: z.array(markerSchema).optional().meta({ description: "Pins on the map" }),
    width: z.number().int().positive().max(MAX_SIZE).default(600).meta({ description: "Map width in pixels" }),
    height: z.number().int().positive().max(MAX_SIZE).default(400).meta({ description: "Map height in pixels" }),
  }),
  callbacks: {
    onMarkerClick: markerSchema.meta({ description: "The clicked marker" }),
  },
});
