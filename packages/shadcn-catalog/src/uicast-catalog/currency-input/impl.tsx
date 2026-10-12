import { createComponentImplementation } from "@uicast/react";
import { use, useState } from "react";
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "../../components/ui/input-group";
import { pickKeyboardEvent } from "../../events/keyboard";
import { FieldLabelId } from "../field/impl";
import { CurrencyInputDef } from "./def";

// Any other currency shows its code.
const SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  CNY: "¥",
  INR: "₹",
  BRL: "R$",
  AUD: "A$",
  CAD: "C$",
};

export const CurrencyInputImpl = createComponentImplementation({
  def: CurrencyInputDef,
  render: ({ value, currency, locale, placeholder, disabled, required, onChange, onKeyDown, onKeyUp }, { entry }) => {
    // The text being typed; out of focus the input shows `value` in the locale's format.
    const [draft, setDraft] = useState<string>();
    const money = new Intl.NumberFormat(locale, { style: "currency", currency });
    const { minimumFractionDigits, maximumFractionDigits } = money.resolvedOptions();
    const amount = new Intl.NumberFormat(locale, { minimumFractionDigits, maximumFractionDigits });
    const plain = new Intl.NumberFormat(locale, { useGrouping: false, maximumFractionDigits: 20 });
    const mark = plain.formatToParts(1.1).find((part) => part.type === "decimal")?.value ?? ".";
    // The locale's format: group separators drop out ("1,500" is 1500 in en-US), its decimal mark splits.
    const parse = (text: string) => {
      const [whole, fraction = ""] = text.split(mark);
      const digits = (part: string) => part.replace(/\D/g, "");
      const sign = /^\s*[-\u2212]/.test(text) ? -1 : 1;
      return sign * Number(`${digits(whole)}.${digits(fraction)}`) || 0;
    };
    return (
      <InputGroup data-key={entry.key}>
        <InputGroupAddon>
          <InputGroupText>{SYMBOLS[currency] ?? currency}</InputGroupText>
        </InputGroupAddon>
        <InputGroupInput
          inputMode="decimal"
          value={draft ?? (value === undefined ? "" : amount.format(value))}
          placeholder={placeholder}
          aria-labelledby={use(FieldLabelId)}
          disabled={disabled}
          required={required}
          onFocus={() => setDraft(value === undefined ? "" : plain.format(value))}
          onBlur={() => setDraft(undefined)}
          onChange={(e) => {
            setDraft(e.target.value);
            const next = parse(e.target.value);
            onChange({ value: next, formatted: money.format(next) });
          }}
          onKeyDown={(e) => onKeyDown(pickKeyboardEvent(e))}
          onKeyUp={(e) => onKeyUp(pickKeyboardEvent(e))}
        />
      </InputGroup>
    );
  },
});
