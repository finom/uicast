import { EntryError } from "../entry-error";
import type { ComponentEntry } from "../types";

const ADDRESS = /^scopes\.([A-Za-z_$][\w$]*)\.([A-Za-z_$][\w$]*)$/;

export const PROTOTYPE_KEYS = new Set([
  "__proto__",
  "constructor",
  "prototype",
  "__defineGetter__",
  "__defineSetter__",
  "__lookupGetter__",
  "__lookupSetter__",
]);

// A row's `$<as>` scope: readable, never written.
export const ROW_FIELDS = new Set(["index", "id", "value"]);

type SetAddressFault = {
  kind: "shape" | "reserved" | "prototype";
  segment?: string;
};

export function findSetAddressFault(address: string): SetAddressFault | null {
  const match = ADDRESS.exec(address);
  if (!match) return { kind: "shape" };
  const [, scope, field] = match;
  const prototype = [scope, field].find((segment) => PROTOTYPE_KEYS.has(segment));
  if (prototype) return { kind: "prototype", segment: prototype };
  return scope.startsWith("$") && ROW_FIELDS.has(field) ? { kind: "reserved", segment: field } : null;
}

// The message names the fix — the recovery prompt forwards it verbatim.
export function setAddressError(address: string, fault: SetAddressFault, elementKey?: string): EntryError {
  const messages: Record<SetAddressFault["kind"], string> = {
    shape: `"set": "${address}" is not an address. A set names one field, "scopes.<scope>.<field>"; to change part of a field, write the whole field.`,
    reserved: `"set": "${address}" writes "${fault.segment}", which the runtime owns (a row's index, id and value are read-only).`,
    prototype: `"set": "${address}" writes through "${fault.segment}", which reaches the prototype chain.`,
  };
  return new EntryError(messages[fault.kind], { reason: "guardrail-violation", elementKey });
}

export function parseSetAddress(address: string, elementKey?: string): { scope: string; field: string } {
  const fault = findSetAddressFault(address);
  if (fault) throw setAddressError(address, fault, elementKey);
  const [, scope, field] = ADDRESS.exec(address) as RegExpExecArray;
  return { scope, field };
}

// The first bad `set` in the entry's seed and callbacks, as the error it raises.
export function entrySetAddressError(entry: Pick<ComponentEntry, "key" | "seed" | "callbacks">): EntryError | null {
  for (const steps of [entry.seed ?? [], ...Object.values(entry.callbacks ?? {})]) {
    for (const { set } of steps) {
      if (set === undefined) continue;
      const fault = findSetAddressFault(set);
      if (fault) return setAddressError(set, fault, entry.key);
    }
  }
  return null;
}
