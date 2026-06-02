import { createAIComponentRenderer } from "@ui-fired/core/render/createAIComponentRenderer";
import { Input } from "@ui-fired/catalog/components/ui/input";
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

export const CurrencyInputRenderer = createAIComponentRenderer({
  def: CurrencyInputDef,
  renderer: ({
    value,
    currency = "USD",
    locale = "en-US",
    placeholder = "0.00",
    disabled = false,
    onChange,
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
          className="pl-8"
          step="0.01"
        />
      </div>
    );
  },
});
