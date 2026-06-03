import z from "zod";

export const onClickSchema = z
  .object({
    pageX: z.number().meta({
      description: "The X coordinate of the click relative to the page",
    }),
    pageY: z.number().meta({
      description: "The Y coordinate of the click relative to the page",
    }),
    screenX: z.number().meta({
      description: "The X coordinate of the click relative to the screen",
    }),
    screenY: z.number().meta({
      description: "The Y coordinate of the click relative to the screen",
    }),
    clientX: z.number().meta({
      description: "The X coordinate of the click relative to the viewport",
    }),
    clientY: z.number().meta({
      description: "The Y coordinate of the click relative to the viewport",
    }),
  })
  .meta({ description: "Callback for when the element is clicked" });

export function pickClick(e: React.MouseEvent) {
  return {
    pageX: e.pageX,
    pageY: e.pageY,
    screenX: e.screenX,
    screenY: e.screenY,
    clientX: e.clientX,
    clientY: e.clientY,
  };
}
