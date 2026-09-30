import { createContext, useEffect, useRef } from "react";

// Set by a Form on submit: each Field whose control failed the check, and the browser's message for it.
export const FieldErrors = createContext<ReadonlyMap<Element, string>>(new Map());

// A Field's control: Select and Checkbox are checked through a hidden stand-in, so it is the first one the user can reach.
export const REACHABLE = ":is(input, select, textarea, button):not([tabindex='-1'])";

// A custom control's value in a hidden required input: a form checks it, and hears each change as it would from typing.
export function RequiredValue({ value }: { value: string }) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const input = ref.current;
    if (!input || input.value === value) return;
    // Past React's setter on the node, which would hide the change from onChange.
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }, [value]);
  return <input ref={ref} required tabIndex={-1} aria-hidden className="sr-only" />;
}
