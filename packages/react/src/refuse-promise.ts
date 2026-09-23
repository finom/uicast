import { EntryError } from "@uicast/core";

// A host function in a reactive site would leak a Promise into render as a truthy object.
export function refusePromise(value: unknown, slot: string, elementKey: string): void {
  if (!(value instanceof Promise)) return;
  // Refused, so nothing awaits it: swallow its rejection.
  value.catch(() => {});
  throw new EntryError(
    `"${slot}" of ${elementKey} evaluated to a Promise — host functions and await are not allowed in props/hidden/loading/each; move the call to seed or a callback step`,
    { reason: "guardrail-violation", elementKey },
  );
}
