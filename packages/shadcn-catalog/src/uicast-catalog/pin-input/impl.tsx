import { createComponentImplementation } from "@uicast/react";
import { useRef } from "react";
import { Input } from "../../components/ui/input";
import { pickKeyboardEvent } from "../../events/keyboard";
import { PinInputDef } from "./def";

export const PinInputImpl = createComponentImplementation({
  def: PinInputDef,
  render: ({ value, length, mask, disabled, type, onChange, onComplete, onKeyDown, onKeyUp }, { entry }) => {
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
      onChange({ value: newValue });

      if (char && index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }

      // join() collapses empty positions, so the full length means every position holds a character.
      if (newValue.length === length) {
        onComplete({ value: newValue });
      }
    };

    return (
      <div className="flex gap-2" data-key={entry.key}>
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
            className="size-12 text-center text-lg font-semibold"
            onChange={(e) => handleInput(i, e.target.value)}
            onKeyDown={(e) => {
              onKeyDown(pickKeyboardEvent(e));
              if (e.key === "Backspace" && !chars[i] && i > 0) {
                inputRefs.current[i - 1]?.focus();
              }
            }}
            onKeyUp={(e) => onKeyUp(pickKeyboardEvent(e))}
          />
        ))}
      </div>
    );
  },
});
