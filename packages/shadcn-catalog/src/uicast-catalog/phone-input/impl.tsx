import { createComponentImplementation } from "@uicast/react";
import { Input } from "../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { pickKeyboardEvent } from "../../events/keyboard";
import { PhoneInputDef } from "./def";
import { type CallingCode, CALLING_CODES } from "../../lib/country-codes";

export const PhoneInputImpl = createComponentImplementation({
  def: PhoneInputDef,
  render: ({ value, countryCode, placeholder, disabled, countryCodes, onChange, onKeyDown, onKeyUp }, { entry }) => {
    const codes = (countryCodes ?? (Object.keys(CALLING_CODES) as CallingCode[])).map((code) => ({
      code,
      country: CALLING_CODES[code],
    }));
    const phoneValue = value ?? "";

    return (
      <div className="flex gap-2" data-key={entry.key}>
        <Select
          value={countryCode}
          onValueChange={(code) =>
            onChange({
              value: phoneValue,
              countryCode: code,
              fullNumber: `${code} ${phoneValue}`,
            })
          }
          disabled={disabled}
        >
          <SelectTrigger className="w-25">
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
            onChange({
              value: e.target.value,
              countryCode,
              fullNumber: `${countryCode} ${e.target.value}`,
            })
          }
          onKeyDown={(e) => onKeyDown(pickKeyboardEvent(e))}
          onKeyUp={(e) => onKeyUp(pickKeyboardEvent(e))}
          className="flex-1"
        />
      </div>
    );
  },
});
