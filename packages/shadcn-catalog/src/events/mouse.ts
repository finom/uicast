import type { MouseEvent } from "react";
import z from "zod";

/**
 * The payload of a mouse callback: page, screen and client coordinates. Its `$id`, `MouseEvent`, prints it once in
 * the prompt, under `## Common Events`.
 *
 * @example
 * createComponentDefinition({
 *   name: "Tile",
 *   description: "A clickable tile.",
 *   callbacks: { onClick: mouseEventSchema }, // printed as onClick(evt: MouseEvent)
 * });
 */
export const mouseEventSchema = z
  .object({
    pageX: z.number().meta({ description: "The X coordinate of the pointer relative to the page" }),
    pageY: z.number().meta({ description: "The Y coordinate of the pointer relative to the page" }),
    screenX: z.number().meta({ description: "The X coordinate of the pointer relative to the screen" }),
    screenY: z.number().meta({ description: "The Y coordinate of the pointer relative to the screen" }),
    clientX: z.number().meta({ description: "The X coordinate of the pointer relative to the viewport" }),
    clientY: z.number().meta({ description: "The Y coordinate of the pointer relative to the viewport" }),
  })
  .meta({ $id: "MouseEvent", description: "Callback for a mouse event such as a click" });

export const pickMouseEvent = ({ pageX, pageY, screenX, screenY, clientX, clientY }: MouseEvent) => ({
  pageX,
  pageY,
  screenX,
  screenY,
  clientX,
  clientY,
});
