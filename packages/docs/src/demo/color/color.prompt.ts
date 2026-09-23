// Shown on the demos page; no model is called.
export const colorPrompt = `Put together a palette studio from my color components: the big saturation/lightness picker with the hue strip, a preview swatch with an alpha knob next to it, and a rail of saved swatches below. Picking anywhere — field or swatch — should update everything at once: the preview, the hex, the whole hsl readout.

Add three buttons: "Suggest palette" (derive a matching set from the current color), "Add current" to save the color to the rail, and a reset that asks first.

Also show the last event payload somewhere — the picker sends hex and h/s/l together in one event and I want to double-check what comes through.`;
