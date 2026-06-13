import { createComponentImplementation } from "@ui-fired/react";
import { Input } from "@ui-fired/catalog/components/ui/input";
import { MaskedInputDef } from "./def";

function applyMask(
  raw: string,
  mask: string,
): { formatted: string; rawValue: string } {
  let formatted = "";
  let rawIndex = 0;
  let rawValue = "";

  for (let i = 0; i < mask.length && rawIndex < raw.length; i++) {
    const maskChar = mask[i];
    if (maskChar === "#") {
      if (/\d/.test(raw[rawIndex])) {
        formatted += raw[rawIndex];
        rawValue += raw[rawIndex];
        rawIndex++;
      } else {
        rawIndex++;
        i--;
      }
    } else if (maskChar === "A") {
      if (/[a-zA-Z]/.test(raw[rawIndex])) {
        formatted += raw[rawIndex];
        rawValue += raw[rawIndex];
        rawIndex++;
      } else {
        rawIndex++;
        i--;
      }
    } else if (maskChar === "*") {
      formatted += raw[rawIndex];
      rawValue += raw[rawIndex];
      rawIndex++;
    } else {
      formatted += maskChar;
    }
  }

  return { formatted, rawValue };
}

export const MaskedInputImpl = createComponentImplementation({
  def: MaskedInputDef,
  render: ({
    value,
    mask = "###-##-####",
    placeholder,
    disabled = false,
    onChange,
    generatedKey,
  }) => {
    return (
      <Input
        value={value ?? ""}
        placeholder={placeholder ?? mask}
        disabled={disabled}
        onChange={(e) => {
          const rawInput = e.target.value.replace(/[^a-zA-Z0-9]/g, "");
          const { formatted, rawValue } = applyMask(rawInput, mask);
          onChange?.({ value: formatted, rawValue });
        }}
        data-key={generatedKey}
      />
    );
  },
});
