import { createAIComponentRenderer } from "@ui-fired/core/render/createAIComponentRenderer";
import { useState } from "react";
import { Input } from "@ui-fired/catalog/components/ui/input";
import { Button } from "@ui-fired/catalog/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { PasswordInputDef } from "./def";

export const PasswordInputRenderer = createAIComponentRenderer({
  def: PasswordInputDef,
  renderer: ({
    value,
    placeholder = "Enter password",
    disabled = false,
    onChange,
    onFocus,
    onBlur,
    generatedKey,
  }) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
      <div className="relative" data-key={generatedKey}>
        <Input
          type={showPassword ? "text" : "password"}
          value={value as string | undefined}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(e) => onChange?.({ value: e.target.value })}
          onFocus={() => onFocus?.({})}
          onBlur={(e) => onBlur?.({ value: e.target.value })}
          className="pr-10"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
          onClick={() => setShowPassword((prev) => !prev)}
          disabled={disabled}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Eye className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      </div>
    );
  },
});
