import { EntryError } from "../entry-error";
import type { ComponentEntry, ConfirmableValueSourceAssignment } from "../types";

// A `set` address names one field: `scopes.<scope>.<field>`. Nothing deeper, no numbers.
const ADDRESS = /^scopes\.([A-Za-z_$][\w$]*)\.([A-Za-z_$][\w$]*)$/;

// Keys that resolve into the prototype chain; refused as scope name and as field.
const PROTOTYPE_KEYS = new Set([
	"__proto__",
	"constructor",
	"prototype",
	"__defineGetter__",
	"__defineSetter__",
	"__lookupGetter__",
	"__lookupSetter__",
]);

// Row fields the runtime owns; readable, never written.
const RESERVED_ROW_FIELDS = new Set(["$id", "$index", "$value"]);

export type SetAddressFault = {
	kind: "shape" | "reserved" | "prototype";
	segment?: string;
};

export function findSetAddressFault(address: string): SetAddressFault | null {
	const match = ADDRESS.exec(address);
	if (!match) return { kind: "shape" };
	const [, scope, field] = match;
	for (const segment of [scope, field]) {
		if (PROTOTYPE_KEYS.has(segment)) return { kind: "prototype", segment };
	}
	if (RESERVED_ROW_FIELDS.has(field)) return { kind: "reserved", segment: field };
	return null;
}

// The message names the fix — the recovery prompt forwards it verbatim.
export function setAddressError(
	address: string,
	fault: SetAddressFault,
	elementKey?: string,
): EntryError {
	const message =
		fault.kind === "shape"
			? `"set": "${address}" is not an address. A set names one field, "scopes.<scope>.<field>"; to change part of a field, write the whole field.`
			: fault.kind === "reserved"
				? `"set": "${address}" writes "${fault.segment}", which the runtime owns ($id, $index and $value are read-only).`
				: `"set": "${address}" writes through "${fault.segment}", which reaches the prototype chain.`;
	return new EntryError(message, { reason: "guardrail-violation", elementKey });
}

export function parseSetAddress(
	address: string,
	elementKey?: string,
): { scope: string; field: string } {
	const fault = findSetAddressFault(address);
	if (fault) throw setAddressError(address, fault, elementKey);
	const [, scope, field] = ADDRESS.exec(address) as RegExpExecArray;
	return { scope, field };
}

// First bad address in an entry's seed/callbacks, or `null`. Pure string scan, runs before any step.
export function findEntrySetAddressFault(
	entry: Pick<ComponentEntry, "seed" | "callbacks">,
): { set: string; fault: SetAddressFault } | null {
	const stepLists: (readonly ConfirmableValueSourceAssignment[])[] = [];
	if (entry.seed) stepLists.push(entry.seed);
	if (entry.callbacks) stepLists.push(...Object.values(entry.callbacks));
	for (const steps of stepLists) {
		for (const step of steps) {
			if (!step.set) continue;
			const fault = findSetAddressFault(step.set);
			if (fault) return { set: step.set, fault };
		}
	}
	return null;
}

export { PROTOTYPE_KEYS, RESERVED_ROW_FIELDS };
