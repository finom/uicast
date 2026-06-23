export const colorPrompt = `Build a browser palette studio from bespoke color components, no backend.

Components (each emits its own custom event payload):
- ColorField — a saturation × lightness square plus a hue strip; picking emits a
  structured { hex, h, s, l } payload — several channels in one event.
- SwatchRail — a row of saved swatches; selecting one emits { index, hex, h, s, l }.
- ColorPreview — read-only; reflects the current color + alpha over a checkerboard.
- Knob — the rotary control from the studio demo, reused here to set alpha.

Wire them into one reactive "color" scope:
- Picking on the field (or a swatch) updates hex + h + s + l together; the
  preview and the CSS readout react instantly.
- The Alpha knob sets transparency.
- "Suggest palette" calls a host function to derive a harmonious set of swatches
  from the current color.
- "Add current" appends the current color to the swatches.
- "Reset" restores the starting swatches behind a confirm prompt.
- A "Last event" panel shows the most recent component event, verbatim.`;
