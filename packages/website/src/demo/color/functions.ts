import { type StandardTool, standardTool } from "standard-tool";
import { z } from "zod";
import { hexToHsl, hslToHex } from "./colors";

const throwOnError = <T>(result: T | Error): T => {
  if (result instanceof Error) throw result;
  return result;
};

/**
 * The color demo's host function: derive a small harmonious palette from a base
 * color (the base, two analogous neighbours, a complement, and a triadic). The
 * "Suggest palette" button's callback `await`s this and writes the result into
 * `scopes.color.swatches`.
 */
const suggestPalette = standardTool({
  name: "suggestPalette",
  description:
    "Given a base hex color, return a small harmonious palette of hex strings.",
  inputSchema: z.object({ hex: z.string() }),
  formatOutput: throwOnError,
  async execute({ hex }): Promise<string[]> {
    const { h, s, l } = hexToHsl(hex);
    const clampL = (x: number) => Math.min(92, Math.max(10, x));
    const mk = (dh: number, dl: number) =>
      hslToHex((h + dh + 360) % 360, s, clampL(l + dl));
    return [mk(0, 0), mk(28, 12), mk(-28, -10), mk(180, 4), mk(150, -14)];
  },
});

export const colorFunctions: StandardTool[] = [suggestPalette];
