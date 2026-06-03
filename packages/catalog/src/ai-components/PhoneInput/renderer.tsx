import { createAIComponentRenderer } from "@ui-fired/react";
import { Input } from "@ui-fired/catalog/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ui-fired/catalog/components/ui/select";
import { PhoneInputDef } from "./def";

const defaultCountryCodes = [
  { code: "+1", country: "US" },
  { code: "+44", country: "UK" },
  { code: "+49", country: "DE" },
  { code: "+33", country: "FR" },
  { code: "+81", country: "JP" },
  { code: "+86", country: "CN" },
  { code: "+91", country: "IN" },
  { code: "+61", country: "AU" },
  { code: "+55", country: "BR" },
  { code: "+7", country: "RU" },
];

export const PhoneInputRenderer = createAIComponentRenderer({
  def: PhoneInputDef,
  renderer: ({
    value,
    countryCode = "+1",
    placeholder = "Phone number",
    disabled = false,
    countryCodes,
    onChange,
    generatedKey,
  }) => {
    const codes = countryCodes ?? defaultCountryCodes;
    const phoneValue = value ?? "";

    return (
      <div className="flex gap-2" data-key={generatedKey}>
        <Select
          value={countryCode}
          onValueChange={(code) =>
            onChange?.({
              value: phoneValue,
              countryCode: code,
              fullNumber: `${code} ${phoneValue}`,
            })
          }
          disabled={disabled}
        >
          <SelectTrigger className="w-[100px]">
            <SelectValue placeholder="Code" />
          </SelectTrigger>
          <SelectContent>
            {codes.map((c) => (
              <SelectItem key={c.code} value={c.code}>
                {c.country} {c.code}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="tel"
          value={phoneValue}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(e) =>
            onChange?.({
              value: e.target.value,
              countryCode,
              fullNumber: `${countryCode} ${e.target.value}`,
            })
          }
          className="flex-1"
        />
      </div>
    );
  },
});
