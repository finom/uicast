import z from "zod";
import { createComponentDefinition } from "@uicast/core";

// Tile servers serve zoom 0 (the whole world on one tile) to 19 (single buildings).
const MAX_ZOOM = 19;
// Bounds the tile count: a box this size takes at most 9 × 9 tiles.
const MAX_SIZE = 2048;

const markerSchema = z.strictObject({
  lat: z.number().min(-90).max(90).meta({ description: "Marker latitude" }),
  lng: z.number().min(-180).max(180).meta({ description: "Marker longitude" }),
  label: z.string().optional().meta({ description: "Shown on hover or focus" }),
});

export const LocationMapDef = createComponentDefinition({
  name: "LocationMap",
  description:
    "A static map: map tiles in a `width` × `height` pixel box, centered on `center` at `zoom`, with a pin for each marker. Hovering or focusing a pin shows its label; clicking it sends the marker to `onMarkerClick`. The map does not pan or zoom. Use LocationMap for store locators, delivery tracking, contact pages, or any location display.",
  props: z.strictObject({
    center: z
      .strictObject({
        lat: z.number().min(-90).max(90).meta({ description: "Latitude" }),
        lng: z.number().min(-180).max(180).meta({ description: "Longitude" }),
      })
      .meta({ description: "Map center coordinates" }),
    zoom: z.number().int().min(0).max(MAX_ZOOM).default(13).meta({
      description: "Zoom level: 0 shows the whole world, 19 single buildings; each step doubles the scale",
    }),
    markers: z.array(markerSchema).optional().meta({ description: "Pins on the map" }),
    width: z.number().int().positive().max(MAX_SIZE).default(600).meta({ description: "Map width in pixels" }),
    height: z.number().int().positive().max(MAX_SIZE).default(400).meta({ description: "Map height in pixels" }),
  }),
  callbacks: {
    onMarkerClick: markerSchema.meta({ description: "The clicked marker" }),
  },
});
