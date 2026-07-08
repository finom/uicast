import { createComponentImplementation } from "@ui-fired/react";
import { useState } from "react";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { pickKeyboardEvent } from "../../events/keyboard";
import { Eye, EyeOff } from "lucide-react";
import { PasswordInputDef } from "./def";

export const PasswordInputImpl = createComponentImplementation({
  def: PasswordInputDef,
  render: ({
    value,
    placeholder = "Enter password",
    disabled = false,
    onChange,
    onFocus,
    onBlur,
    onKeyDown,
    onKeyUp,
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
          onKeyDown={(e) => onKeyDown?.(pickKeyboardEvent(e))}
          onKeyUp={(e) => onKeyUp?.(pickKeyboardEvent(e))}
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
            <EyeOff className="size-4 text-muted-foreground" />
          ) : (
            <Eye className="size-4 text-muted-foreground" />
          )}
        </Button>
      </div>
    );
  },
});
