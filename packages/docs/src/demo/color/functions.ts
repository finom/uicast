import { type StandardToolV0, standardTool } from "standard-tool";
import { z } from "zod";
import { hexToHsl, hslToHex } from "./colors";

const suggestPalette = standardTool({
  name: "suggestPalette",
  description:
    "Given a base hex color, return a small harmonious palette of hex strings.",
  inputSchema: z.object({ hex: z.string() }),
  outputSchema: z.array(z.string()),
  async execute({ hex }): Promise<string[]> {
    const { h, s, l } = hexToHsl(hex);
    const clampL = (x: number) => Math.min(92, Math.max(10, x));
    const mk = (dh: number, dl: number) =>
      hslToHex((h + dh + 360) % 360, s, clampL(l + dl));
    return [mk(0, 0), mk(28, 12), mk(-28, -10), mk(180, 4), mk(150, -14)];
  },
});

export const colorFunctions: StandardToolV0[] = [suggestPalette];
