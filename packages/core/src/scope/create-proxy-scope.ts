import { EntryError } from "../entry-error";
import { PROTOTYPE_KEYS, ROW_FIELDS } from "./parse-set-address";

interface Emitter {
  // Subscribes to one field, or to every field with `"*"`. Returns the unsubscribe function.
  on(field: string, handler: () => void): () => void;
  // Calls the field's handlers, then the `"*"` ones.
  emit(field: string): void;
  // A subscriber attaching after render compares it to what it saw while rendering; higher means a write landed unheard.
  readonly emits: number;
}

function createEmitter(): Emitter {
  const events = new Map<string, Set<() => void>>();
  let emits = 0;

  return {
    get emits() {
      return emits;
    },

    on(field, handler) {
      const handlers = events.get(field);
      if (handlers) handlers.add(handler);
      else events.set(field, new Set([handler]));
      return () => events.get(field)?.delete(handler);
    },

    emit(field) {
      emits++;
      for (const fn of events.get(field) ?? []) fn();
      for (const fn of events.get("*") ?? []) fn();
    },
  };
}

type SetOptions = { default?: boolean };

/**
 * A scope: its fields as plain properties, plus `$$emitter` and `$$set`. A write to a field emits it; a write inside
 * a field's value changes plain data and emits nothing.
 *
 * @example
 * const root: ReactiveProxy = createProxyScope();
 * const off = root.$$emitter.on("user", () => console.log(root.user));
 */
type ReactiveProxy<T extends object = Record<string, unknown>> = T & {
  /** Field subscriptions, e.g. `scope.$$emitter.on("user", handler)`, which returns the unsubscribe function. */
  $$emitter: Pick<Emitter, "on">;
  /** Writes a field, like assignment. `{ default: true }` writes only while it is undefined (first writer wins). */
  $$set: (field: string, value: unknown, options?: SetOptions) => void;
};

const isObject = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === "object";

// Every scope's emitter is `createEmitter`'s, so the count is there.
const countEmits = (scope: ReactiveProxy): number => (scope.$$emitter as Emitter).emits;

function assertField(field: string): void {
  if (PROTOTYPE_KEYS.has(field)) {
    throw new EntryError(`Cannot set "${field}": it reaches the prototype chain.`, {
      reason: "guardrail-violation",
    });
  }
  if (field.includes(".")) {
    throw new EntryError(`Cannot set "${field}": a scope field has no dots. Write the whole field.`, {
      reason: "guardrail-violation",
    });
  }
}

/**
 * Creates a reactive scope: a shallow proxy over `bag`. A write to a field emits it, so every element reading that
 * field re-renders.
 *
 * @example
 * const userCtx = createProxyScope({ name: "Hopper", plan: "pro" });
 * const init: InitFn = ({ scopes }) => { scopes.userCtx = userCtx; }; // read as scopes.userCtx.name
 *
 * @example
 * userCtx.plan = "free"; // emits "plan"
 * userCtx.$$set("plan", "pro", { default: true }); // no-op: "plan" is set
 */
function createProxyScope<T extends object>(bag: T = {} as T): ReactiveProxy<T> {
  const emitter = createEmitter();
  const fields = bag as Record<string, unknown>;

  const write = (field: string, value: unknown, options?: SetOptions): void => {
    assertField(field);
    const oldValue = fields[field];
    if (options?.default && oldValue !== undefined) return;
    if (Object.is(oldValue, value)) return;
    fields[field] = value;
    emitter.emit(field);
  };

  return new Proxy(bag, {
    get(target, prop, receiver) {
      if (prop === "$$emitter") return emitter;
      if (prop === "$$set") return write;
      return Reflect.get(target, prop, receiver);
    },
    set(target, prop, value) {
      if (typeof prop !== "string") return Reflect.set(target, prop, value);
      write(prop, value);
      return true;
    },
  }) as ReactiveProxy<T>;
}

type ForwardTarget = { scope: ReactiveProxy; field: string };

type RowScope = {
  proxy: ReactiveProxy<Record<string, unknown>>;
  // Silent: the container calls it during render. False when the row's own write already moved it there.
  retarget(element: unknown): boolean;
  // The scopes the row sees and the paths its list's `each` reads: where a write finds the item.
  see(scopes: Record<string, ReactiveProxy>, sources: readonly string[]): void;
  // The list dropped this row; a later write is a document mistake.
  detach(): void;
};

// Deeper than any result the evaluator lets out.
const MAX_DATA_DEPTH = 256;

// `value` with each part `swap` changes replaced, down to `depth` levels, copying what holds it; the same value when
// nothing changes.
function rebuild(value: unknown, swap: (part: unknown) => unknown, depth: number): unknown {
  const swapped = swap(value);
  if (swapped !== value || depth === 0 || !isObject(value)) return swapped;
  if (Array.isArray(value)) {
    let out: unknown[] | null = null;
    for (let i = 0; i < value.length; i++) {
      const next = rebuild(value[i], swap, depth - 1);
      if (next === value[i]) continue;
      out ??= [...value];
      out[i] = next;
    }
    return out ?? value;
  }
  let out: Record<string, unknown> | null = null;
  for (const [key, child] of Object.entries(value)) {
    const next = rebuild(child, swap, depth - 1);
    if (next === child) continue;
    out ??= { ...value };
    out[key] = next;
  }
  return out ?? value;
}

// How many levels below `value` the item first appears, or -1. Level by level, each object once, so a cycle ends.
function levelOf(value: unknown, item: object): number {
  if (value === item) return 0;
  const seen = new WeakSet<object>();
  let level = [value];
  for (let depth = 1; level.length > 0; depth++) {
    const next: unknown[] = [];
    for (const node of level) {
      if (!isObject(node) || seen.has(node)) continue;
      seen.add(node);
      for (const child of Array.isArray(node) ? node : Object.values(node)) {
        if (child === item) return depth;
        if (isObject(child)) next.push(child);
      }
    }
    level = next;
  }
  return -1;
}

// Follows `path` down own keys, then replaces the item wherever it first appears below.
function replaceAt(value: unknown, path: readonly string[], from: object, to: object): unknown {
  if (path.length === 0) {
    const depth = levelOf(value, from);
    return depth === -1 ? value : rebuild(value, (part) => (part === from ? to : part), depth);
  }
  const [key, ...rest] = path;
  if (!isObject(value) || !Object.hasOwn(value, key)) return value;
  const next = replaceAt(value[key], rest, from, to);
  if (next === value[key]) return value;
  return Array.isArray(value) ? Object.assign([...value], { [key]: next }) : { ...value, [key]: next };
}

const forwardTargetsByProxy = new WeakMap<ReactiveProxy, () => ForwardTarget[]>();

// A row window's current item.
const itemOfWindow = new WeakMap<object, () => unknown>();

// Every row window in `value` swapped for the item it shows now: a result holds the data, not a live view that a
// later write changes behind the memo.
const unwrapRows = (value: unknown): unknown =>
  rebuild(value, (part) => (isObject(part) ? (itemOfWindow.get(part)?.() ?? part) : part), MAX_DATA_DEPTH);

// The fields a row's write replaces: those its list's `each` reads. Empty for a root-kind scope.
const getForwardTargets = (proxy: ReactiveProxy): ForwardTarget[] => forwardTargetsByProxy.get(proxy)?.() ?? [];

const ENGINE_DESCRIPTOR = { writable: false, enumerable: false, configurable: true };

// A write never changes the item: it puts a copy in the fields `each` reads. A field of an outer row is that row's
// write, so a nested edit climbs to the outermost array.
function createRowScope(): RowScope {
  const emitter = createEmitter();
  let element: unknown;
  let visible: Record<string, ReactiveProxy> = {};
  let reads: readonly string[] = [];
  let detached = false;

  // "scopes.root.data.items" → root's `data` field, then `items` below it. A bare scope names no field.
  const sources = () => {
    const out: { scope: ReactiveProxy; field: string; path: string[] }[] = [];
    for (const read of reads) {
      const [name, field, ...path] = read.split(".").slice(1);
      const scope = Object.hasOwn(visible, name) ? visible[name] : undefined;
      if (scope && field !== undefined && Object.hasOwn(scope, field)) out.push({ scope, field, path });
    }
    return out;
  };

  const write = (field: string, value: unknown, options?: SetOptions): void => {
    assertField(field);
    if (!isObject(element) || Array.isArray(element)) {
      const kind = element === null ? "null" : Array.isArray(element) ? "an array" : `a ${typeof element}`;
      throw new EntryError(
        `Cannot set "${field}": this row holds ${kind}, not an object. Replace it through the array it came from.`,
        { reason: "guardrail-violation" },
      );
    }
    const oldValue = element[field];
    if (options?.default && oldValue !== undefined) return;
    if (Object.is(oldValue, value)) return;
    const copy = { ...element, [field]: value };
    // Two sources may share a field (`data.a`, `data.b`), so each builds on the last.
    const next = new Map<ReactiveProxy, Map<string, unknown>>();
    for (const { scope, field: name, path } of detached ? [] : sources()) {
      const pending = next.get(scope);
      const current = pending?.has(name) ? pending.get(name) : scope[name];
      const replaced = replaceAt(current, path, element, copy);
      if (replaced !== current) next.set(scope, (pending ?? new Map()).set(name, replaced));
    }
    if (next.size === 0) {
      throw new EntryError(
        `Cannot set "${field}": this item is in no field "each" reads — the row was removed, or "each" built a new object. Edit the array it came from.`,
        { reason: "unknown-reference" },
      );
    }
    for (const [scope, fields] of next) for (const [name, replaced] of fields) scope.$$set(name, replaced);
    element = copy;
    emitter.emit(field);
  };

  const proxy = new Proxy(
    {},
    {
      get(_, prop) {
        if (prop === "$$emitter") return emitter;
        if (prop === "$$set") return write;
        if (typeof prop !== "string") return undefined;
        return isObject(element) ? element[prop] : undefined;
      },
      has(_, prop) {
        return typeof prop === "string" && isObject(element) && Object.hasOwn(element, prop);
      },
      ownKeys() {
        return isObject(element) ? Reflect.ownKeys(element) : [];
      },
      getOwnPropertyDescriptor(_, prop) {
        if (typeof prop !== "string" || !isObject(element)) return undefined;
        const desc = Object.getOwnPropertyDescriptor(element, prop);
        // The proxy target has no such property, so it must be reported configurable.
        return desc ? { ...desc, configurable: true } : undefined;
      },
      set(_, prop, value) {
        if (typeof prop !== "string") return false;
        write(prop, value);
        return true;
      },
    },
  ) as ReactiveProxy<Record<string, unknown>>;
  forwardTargetsByProxy.set(proxy, () => sources().map(({ scope, field }) => ({ scope, field })));
  itemOfWindow.set(proxy, () => element);

  return {
    proxy,
    retarget(nextElement) {
      const moved = nextElement !== element;
      element = nextElement;
      return moved;
    },
    see(scopes, eachReads) {
      visible = scopes;
      reads = eachReads;
    },
    detach() {
      detached = true;
    },
  };
}

type RowState = {
  proxy: ReactiveProxy<Record<string, unknown>>;
  // Silent: the container calls it during render.
  retarget(element: unknown, index: number, id: string | number): void;
};

// `scopes.$<as>`: the runtime's read-only `index`, `id` and `value`, then whatever the row's steps set.
function createRowState(): RowState {
  const scope = createProxyScope<Record<string, unknown>>(Object.create(null));
  let runtime: Record<string, unknown> = {};

  const write = (field: string, value: unknown, options?: SetOptions): void => {
    if (ROW_FIELDS.has(field)) {
      throw new EntryError(`Cannot set "${field}": the runtime owns it.`, { reason: "guardrail-violation" });
    }
    scope.$$set(field, value, options);
  };

  const proxy = new Proxy(scope, {
    get(target, prop, receiver) {
      if (prop === "$$set") return write;
      if (typeof prop === "string" && ROW_FIELDS.has(prop)) return runtime[prop];
      return Reflect.get(target, prop, receiver);
    },
    has(target, prop) {
      return (typeof prop === "string" && ROW_FIELDS.has(prop)) || Reflect.has(target, prop);
    },
    getOwnPropertyDescriptor(target, prop) {
      if (typeof prop === "string" && ROW_FIELDS.has(prop)) return { ...ENGINE_DESCRIPTOR, value: runtime[prop] };
      return Reflect.getOwnPropertyDescriptor(target, prop);
    },
    set(_, prop, value) {
      if (typeof prop !== "string") return false;
      write(prop, value);
      return true;
    },
  });

  return {
    proxy,
    retarget(element, index, id) {
      runtime = { index, id, value: isObject(element) ? undefined : element };
    },
  };
}

export {
  createProxyScope,
  createRowScope,
  createRowState,
  countEmits,
  getForwardTargets,
  unwrapRows,
  type ReactiveProxy,
  type RowScope,
  type RowState,
};
