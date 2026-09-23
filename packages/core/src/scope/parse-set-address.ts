import { EntryError } from "../entry-error";
import type { ComponentEntry, CallbackValueSourceAssignment } from "../types";

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

// Readable, never written.
export const RESERVED_ROW_FIELDS = new Set(["$id", "$index", "$value"]);

type SetAddressFault = {
	kind: "shape" | "reserved" | "prototype";
	segment?: string;
};

const segmentFault = (scope: string, field: string): SetAddressFault | null => {
	for (const segment of [scope, field]) {
		if (PROTOTYPE_KEYS.has(segment)) return { kind: "prototype", segment };
	}
	return RESERVED_ROW_FIELDS.has(field) ? { kind: "reserved", segment: field } : null;
};

export function findSetAddressFault(address: string): SetAddressFault | null {
	const match = ADDRESS.exec(address);
	return match ? segmentFault(match[1], match[2]) : { kind: "shape" };
}

// The message names the fix — the recovery prompt forwards it verbatim.
export function setAddressError(
	address: string,
	fault: SetAddressFault,
	elementKey?: string,
): EntryError {
	const messages: Record<SetAddressFault["kind"], string> = {
		shape: `"set": "${address}" is not an address. A set names one field, "scopes.<scope>.<field>"; to change part of a field, write the whole field.`,
		reserved: `"set": "${address}" writes "${fault.segment}", which the runtime owns ($id, $index and $value are read-only).`,
		prototype: `"set": "${address}" writes through "${fault.segment}", which reaches the prototype chain.`,
	};
	return new EntryError(messages[fault.kind], { reason: "guardrail-violation", elementKey });
}

export function parseSetAddress(
	address: string,
	elementKey?: string,
): { scope: string; field: string } {
	const match = ADDRESS.exec(address);
	if (!match) throw setAddressError(address, { kind: "shape" }, elementKey);
	const [, scope, field] = match;
	const fault = segmentFault(scope, field);
	if (fault) throw setAddressError(address, fault, elementKey);
	return { scope, field };
}

export function findEntrySetAddressFault(
	entry: Pick<ComponentEntry, "seed" | "callbacks">,
): { set: string; fault: SetAddressFault } | null {
	const stepLists: (readonly CallbackValueSourceAssignment[])[] = [];
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
