import { createComponentImplementation } from "@uicast/react";
import { useState } from "react";
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "../../components/ui/input-group";
import { pickKeyboardEvent } from "../../events/keyboard";
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
  render: ({ value, currency, locale, placeholder, disabled, onChange, onKeyDown, onKeyUp }, { entry }) => {
    // The text being typed; out of focus the input shows `value` in the locale's format.
    const [draft, setDraft] = useState<string>();
    const money = new Intl.NumberFormat(locale, { style: "currency", currency });
    const { minimumFractionDigits, maximumFractionDigits } = money.resolvedOptions();
    const amount = new Intl.NumberFormat(locale, { minimumFractionDigits, maximumFractionDigits });
    return (
      <InputGroup data-key={entry.key}>
        <InputGroupAddon>
          <InputGroupText>{SYMBOLS[currency] ?? currency}</InputGroupText>
        </InputGroupAddon>
        <InputGroupInput
          inputMode="decimal"
          value={draft ?? (value === undefined ? "" : amount.format(value))}
          placeholder={placeholder}
          disabled={disabled}
          onFocus={() => setDraft(value === undefined ? "" : String(value))}
          onBlur={() => setDraft(undefined)}
          onChange={(e) => {
            setDraft(e.target.value);
            const next = Number.parseFloat(e.target.value.replace(",", ".")) || 0;
            onChange({ value: next, formatted: money.format(next) });
          }}
          onKeyDown={(e) => onKeyDown(pickKeyboardEvent(e))}
          onKeyUp={(e) => onKeyUp(pickKeyboardEvent(e))}
        />
      </InputGroup>
    );
  },
});
