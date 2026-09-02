import { EntryError } from "../entry-error";
import { PROTOTYPE_KEYS, RESERVED_ROW_FIELDS } from "./parse-set-address";

type EventHandler<T = unknown> = (payload: T) => void;

interface ChangePayload<T = unknown> {
  field: string;
  value: T;
  oldValue: T;
}

interface Emitter {
  // Subscribe to one field; `"*"` receives every emit. Returns unsubscribe.
  on(field: string, handler: EventHandler<ChangePayload>): () => void;
  emit(field: string, payload: ChangePayload): void;
  // Emit count. A subscriber attaching after render compares this to what it saw while rendering — advanced means a write landed unheard, so re-read.
  readonly version: number;
}

function createEmitter(): Emitter {
  const events = new Map<string, Set<EventHandler<ChangePayload>>>();
  let version = 0;

  return {
    get version() {
      return version;
    },

    on(field, handler) {
      const handlers = events.get(field);
      if (handlers) handlers.add(handler);
      else events.set(field, new Set([handler]));
      return () => events.get(field)?.delete(handler);
    },

    emit(field, payload) {
      version++;
      events.get(field)?.forEach((fn) => {
        fn(payload);
      });
      events.get("*")?.forEach((fn) => {
        fn(payload);
      });
    },
  };
}

type SetOptions = { default?: boolean };

type ReactiveProxy<T extends object = object> = T & {
  $emitter: Emitter;
  // `default: true` writes only when the field is still undefined (first writer wins).
  $set: (field: string, value: unknown, options?: SetOptions) => void;
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object";

// A field is one name: prototype keys would land on the prototype chain, a dot would be a path.
function assertField(field: string): void {
  if (PROTOTYPE_KEYS.has(field)) {
    throw new EntryError(`Cannot set "${field}": it reaches the prototype chain.`, {
      reason: "guardrail-violation",
    });
  }
  if (field.includes(".")) {
    throw new EntryError(
      `Cannot set "${field}": a scope field has no dots. Write the whole field.`,
      { reason: "guardrail-violation" },
    );
  }
}

// One scope over its own bag. Reads are plain; a write replaces one field and emits it.
function createProxyScope<T extends object>(bag: T = {} as T): ReactiveProxy<T> {
  const emitter = createEmitter();
  const fields = bag as Record<string, unknown>;

  const write = (field: string, value: unknown, options?: SetOptions): void => {
    assertField(field);
    const oldValue = fields[field];
    if (options?.default && oldValue !== undefined) return;
    if (Object.is(oldValue, value)) return;
    fields[field] = value;
    emitter.emit(field, { field, value, oldValue });
  };

  return new Proxy(bag, {
    get(target, prop, receiver) {
      if (prop === "$emitter") return emitter;
      if (prop === "$set") return write;
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
  // Silent: the container calls it during render.
  retarget(element: unknown, index: number, id: string | number): void;
  // The scopes whose fields may hold the element: root, host scopes, ancestor rows.
  see(scopes: Record<string, ReactiveProxy>): void;
  // The list dropped this row; a later write is a document mistake.
  detach(): void;
};

// Whether `value` is the element or holds it one level down: an array, an array of arrays, an object's values.
const holds = (value: unknown, element: unknown): boolean => {
  if (value === element) return true;
  if (Array.isArray(value)) return value.includes(element) || value.some((v) => Array.isArray(v) && v.includes(element));
  return isObject(element) && isObject(value) && Object.values(value).includes(element);
};

const forwardTargetsByProxy = new WeakMap<ReactiveProxy, () => ForwardTarget[]>();

// Every window onto one element, so a write through one wakes the others (two lists over one array).
const windowsByElement = new WeakMap<object, Set<Emitter>>();

// The fields, in the scopes a row can see, that hold its element by identity. Empty for a root-kind scope.
const getForwardTargets = (proxy: ReactiveProxy): ForwardTarget[] =>
  forwardTargetsByProxy.get(proxy)?.() ?? [];

const ENGINE_DESCRIPTOR = { writable: false, enumerable: true, configurable: true };

// A window onto one element of the array a list iterates. A write changes the element in place,
// then emits on the row and on every field holding the element; a nested row's emit climbs the same way.
function createRowScope(): RowScope {
  const emitter = createEmitter();
  let element: unknown;
  let index = 0;
  let id: string | number = 0;
  let visible: Record<string, ReactiveProxy> = {};
  let detached = false;

  const unregister = () => {
    if (isObject(element)) windowsByElement.get(element)?.delete(emitter);
  };

  const findTargets = (): ForwardTarget[] => {
    const out: ForwardTarget[] = [];
    for (const scope of Object.values(visible)) {
      for (const field of Object.keys(scope)) {
        if (holds((scope as Record<string, unknown>)[field], element)) out.push({ scope, field });
      }
    }
    return out;
  };

  emitter.on("*", () => {
    for (const t of findTargets()) {
      t.scope.$emitter.emit(t.field, { field: t.field, value: undefined, oldValue: undefined });
    }
  });

  const engineField = (prop: string): unknown => {
    if (prop === "$index") return index;
    if (prop === "$id") return id;
    if (prop === "$value") return isObject(element) ? undefined : element;
    return undefined;
  };
  const isEngineField = (prop: string): boolean =>
    RESERVED_ROW_FIELDS.has(prop) && (prop !== "$value" || !isObject(element));

  const write = (field: string, value: unknown, options?: SetOptions): void => {
    assertField(field);
    if (RESERVED_ROW_FIELDS.has(field)) {
      throw new EntryError(`Cannot set "${field}": the runtime owns it.`, {
        reason: "guardrail-violation",
      });
    }
    if (!isObject(element)) {
      throw new EntryError(
        `Cannot set "${field}": this row holds a ${element === null ? "null" : typeof element}, not an object. Replace it through the array it came from.`,
        { reason: "guardrail-violation" },
      );
    }
    const oldValue = element[field];
    if (options?.default && oldValue !== undefined) return;
    if (Object.is(oldValue, value)) return;
    if (detached || findTargets().length === 0) {
      throw new EntryError(
        `Cannot set "${field}": this row's data is in no scope field — the row was removed, or "each" built a new object. Edit the array it came from.`,
        { reason: "unknown-reference" },
      );
    }
    try {
      element[field] = value;
    } catch (err) {
      throw new EntryError(`Cannot set "${field}": the row's data is not writable.`, {
        reason: "expression-runtime",
        cause: err,
      });
    }
    const payload = { field, value, oldValue };
    emitter.emit(field, payload);
    for (const other of windowsByElement.get(element) ?? []) {
      if (other !== emitter) other.emit(field, payload);
    }
  };

  const proxy = new Proxy(
    {},
    {
      get(_, prop) {
        if (prop === "$emitter") return emitter;
        if (prop === "$set") return write;
        if (typeof prop !== "string") return undefined;
        if (isEngineField(prop)) return engineField(prop);
        return isObject(element) ? element[prop] : undefined;
      },
      has(_, prop) {
        if (typeof prop !== "string") return false;
        return isEngineField(prop) || (isObject(element) && Object.hasOwn(element, prop));
      },
      ownKeys() {
        const keys = isObject(element)
          ? Reflect.ownKeys(element).filter((k) => typeof k !== "string" || !RESERVED_ROW_FIELDS.has(k))
          : [];
        keys.push("$index", "$id");
        if (!isObject(element)) keys.push("$value");
        return keys;
      },
      getOwnPropertyDescriptor(_, prop) {
        if (typeof prop !== "string") return undefined;
        if (isEngineField(prop)) return { ...ENGINE_DESCRIPTOR, value: engineField(prop) };
        if (!isObject(element)) return undefined;
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
  forwardTargetsByProxy.set(proxy, findTargets);

  return {
    proxy,
    retarget(nextElement, nextIndex, nextId) {
      if (nextElement !== element) {
        unregister();
        if (isObject(nextElement)) {
          const windows = windowsByElement.get(nextElement) ?? new Set();
          windows.add(emitter);
          windowsByElement.set(nextElement, windows);
        }
      }
      element = nextElement;
      index = nextIndex;
      id = nextId;
    },
    see(scopes) {
      visible = scopes;
    },
    detach() {
      detached = true;
      unregister();
    },
  };
}

export {
  createProxyScope,
  createRowScope,
  createEmitter,
  getForwardTargets,
  type Emitter,
  type ChangePayload,
  type EventHandler,
  type ReactiveProxy,
  type RowScope,
  type ForwardTarget,
};
