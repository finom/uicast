import { createComponentImplementation } from "@uicast/react";
import { Input } from "../../components/ui/input";
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
  render: ({ value, currency, locale, placeholder, disabled, onChange, onKeyDown, onKeyUp }, { entry }) => (
    <div className="relative" data-key={entry.key}>
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
        {SYMBOLS[currency] ?? currency}
      </span>
      <Input
        type="number"
        value={value ?? ""}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => {
          const amount = Number.parseFloat(e.target.value) || 0;
          const formatted = new Intl.NumberFormat(locale, { style: "currency", currency }).format(amount);
          onChange({ value: amount, formatted });
        }}
        onKeyDown={(e) => onKeyDown(pickKeyboardEvent(e))}
        onKeyUp={(e) => onKeyUp(pickKeyboardEvent(e))}
        className="pl-8"
        step="0.01"
      />
    </div>
  ),
});
