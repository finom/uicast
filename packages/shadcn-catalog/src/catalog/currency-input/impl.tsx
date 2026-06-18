import { createComponentImplementation } from "@ui-fired/react";
import { Input } from "../../components/ui/input";
import { pickKeyboardEvent } from "../../events/keyboard";
import { CurrencyInputDef } from "./def";

const currencySymbols: Record<string, string> = {
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
  render: ({
    value,
    currency = "USD",
    locale = "en-US",
    placeholder = "0.00",
    disabled = false,
    onChange,
    onKeyDown,
    onKeyUp,
    generatedKey,
  }) => {
    const symbol = currencySymbols[currency] ?? currency;
    const displayValue = value != null ? String(value) : "";

    const formatCurrency = (num: number) => {
      try {
        return new Intl.NumberFormat(locale, {
          style: "currency",
          currency,
        }).format(num);
      } catch {
        return `${symbol}${num.toFixed(2)}`;
      }
    };

    return (
      <div className="relative" data-key={generatedKey}>
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
          {symbol}
        </span>
        <Input
          type="number"
          value={displayValue}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(e) => {
            const numValue = parseFloat(e.target.value) || 0;
            onChange?.({
              value: numValue,
              formatted: formatCurrency(numValue),
            });
          }}
          onKeyDown={(e) => onKeyDown?.(pickKeyboardEvent(e))}
          onKeyUp={(e) => onKeyUp?.(pickKeyboardEvent(e))}
          className="pl-8"
          step="0.01"
        />
      </div>
    );
  },
});
