import { createAIComponentRenderer } from "@ui-fired/core/render/createAIComponentRenderer";
import { useRef } from "react";
import { Input } from "@ui-fired/catalog/components/ui/input";
import { cn } from "@ui-fired/core/lib/utils";
import { PinInputDef } from "./def";

export const PinInputRenderer = createAIComponentRenderer({
  def: PinInputDef,
  renderer: ({
    value = "",
    length = 6,
    mask = false,
    disabled = false,
    type = "numeric",
    onChange,
    onComplete,
    generatedKey,
  }) => {
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const chars = value.split("").slice(0, length);

    const handleInput = (index: number, char: string) => {
      const isValid =
        type === "numeric" ? /^\d?$/.test(char) : /^[a-zA-Z0-9]?$/.test(char);
      if (!isValid) return;

      const newChars = [...chars];
      while (newChars.length < length) newChars.push("");
      newChars[index] = char;
      const newValue = newChars.join("");
      onChange?.({ value: newValue });

      if (char && index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }

      if (newValue.length === length && !newValue.includes("")) {
        onComplete?.({ value: newValue });
      }
    };

    return (
      <div className="flex gap-2" data-key={generatedKey}>
        {Array.from({ length }).map((_, i) => (
          <Input
            key={i}
            ref={(el) => {
              inputRefs.current[i] = el;
            }}
            type={mask ? "password" : "text"}
            inputMode={type === "numeric" ? "numeric" : "text"}
            maxLength={1}
            value={chars[i] ?? ""}
            disabled={disabled}
            className={cn("h-12 w-12 text-center text-lg font-semibold")}
            onChange={(e) => handleInput(i, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Backspace" && !chars[i] && i > 0) {
                inputRefs.current[i - 1]?.focus();
              }
            }}
          />
        ))}
      </div>
    );
  },
});
