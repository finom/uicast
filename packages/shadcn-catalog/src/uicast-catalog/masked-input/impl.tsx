import { createComponentImplementation } from "@uicast/react";
import { Input } from "../../components/ui/input";
import { pickKeyboardEvent } from "../../events/keyboard";
import { MaskedInputDef } from "./def";

// What each mask character takes: `#` a digit, `A` a letter, `*` anything. Other characters are copied as they are.
const SLOTS: Record<string, RegExp> = { "#": /\d/, A: /[a-zA-Z]/, "*": /[\s\S]/ };

// Characters a slot refuses are skipped; the mask stops where the input runs out.
function applyMask(raw: string, mask: string): { formatted: string; rawValue: string } {
  let formatted = "";
  let rawValue = "";
  let next = 0;
  for (let i = 0; i < mask.length && next < raw.length; i++) {
    const slot = SLOTS[mask[i]];
    if (!slot) {
      formatted += mask[i];
      continue;
    }
    while (next < raw.length && !slot.test(raw[next])) next++;
    if (next === raw.length) break;
    formatted += raw[next];
    rawValue += raw[next++];
  }
  return { formatted, rawValue };
}

export const MaskedInputImpl = createComponentImplementation({
  def: MaskedInputDef,
  render: ({ value, mask, placeholder, disabled, onChange, onKeyDown, onKeyUp }, { entry }) => (
    <Input
      value={value ?? ""}
      placeholder={placeholder ?? mask}
      disabled={disabled}
      onChange={(e) => {
        const { formatted, rawValue } = applyMask(e.target.value.replace(/[^a-zA-Z0-9]/g, ""), mask);
        onChange({ value: formatted, rawValue });
      }}
      onKeyDown={(e) => onKeyDown(pickKeyboardEvent(e))}
      onKeyUp={(e) => onKeyUp(pickKeyboardEvent(e))}
      data-key={entry.key}
    />
  ),
});
