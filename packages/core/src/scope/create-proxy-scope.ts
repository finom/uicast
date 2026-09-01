import { EntryError } from "../entry-error";
import { PROTOTYPE_KEYS } from "./validate-set-path";

type EventHandler<T = unknown> = (payload: T) => void;

interface ChangePayload<T = unknown> {
  path: string;
  value: T;
  oldValue: T;
}

interface Emitter {
  /** Subscribe; returns unsubscribe. Type `"*"` receives every emit. */
  on(type: string, handler: EventHandler<ChangePayload>): () => void;
  emit(type: string, payload: ChangePayload): void;
  /** Emit count. A subscriber attaching after render compares this to what it saw while rendering — advanced means a write landed unheard, so re-read. */
  readonly version: number;
}

function createEmitter(): Emitter {
  const events = new Map<string, Set<EventHandler<ChangePayload>>>();
  let version = 0;

  return {
    get version() {
      return version;
    },

    on(type, handler) {
      const handlers = events.get(type);
      if (handlers) handlers.add(handler);
      else events.set(type, new Set([handler]));
      return () => events.get(type)?.delete(handler);
    },

    emit(type, payload) {
      version++;
      events.get(type)?.forEach((fn) => {
        fn(payload);
      });
      // Writing a path replaces everything beneath it, so subscribers of
      // deeper paths must wake too: a write to `products` wakes a reader of
      // `products.length`. The reverse direction stays exact — a write to
      // `rows.0.name` does not wake a reader of `rows`.
      const prefix = `${type}.`;
      for (const [key, handlers] of events) {
        if (key.startsWith(prefix)) {
          handlers.forEach((fn) => {
            fn(payload);
          });
        }
      }
      events.get("*")?.forEach((fn) => {
        fn(payload);
      });
    },
  };
}

type ReactiveProxy<T extends object = object> = T & {
  $emitter: Emitter;
  $set: (path: string, value: unknown, options?: { default?: boolean }) => void;
};

function createProxyScope<T extends object>(
  target: T = {} as T,
): ReactiveProxy<T> {
  const emitter = createEmitter();
  const proxyCache = new WeakMap<object, object>();

  function set(
    path: string,
    value: unknown,
    options?: { default?: boolean },
  ): void {
    const keys = path.split(".");

    // Sink guard: a `__proto__`/`constructor` segment resolves into the
    // prototype chain and the write lands on `Object.prototype`. Rejected
    // statically upstream; this catches direct `$set` callers.
    for (const key of keys) {
      if (PROTOTYPE_KEYS.has(key)) {
        throw new EntryError(
          `Cannot set "${path}": "${key}" reaches the prototype chain.`,
          { reason: "guardrail-violation" },
        );
      }
    }

    let current = proxy as Record<string, unknown>;

    // A missing parent throws — inventing one would turn typos and `tags.0`
    // into silent no-ops instead of classified document faults.
    for (let i = 0; i < keys.length - 1; i++) {
      const next = current[keys[i]];
      if (next === undefined || next === null) {
        throw new EntryError(
          `Cannot set "${path}": "${keys.slice(0, i + 1).join(".")}" is not set. Seed the parent path first.`,
          { reason: "unknown-reference" },
        );
      }
      // A primitive parent fails the same way as a missing one — classified,
      // not V8's raw "Cannot create property" TypeError.
      if (typeof next !== "object") {
        throw new EntryError(
          `Cannot set "${path}": "${keys.slice(0, i + 1).join(".")}" is not an object.`,
          { reason: "unknown-reference" },
        );
      }
      current = next as Record<string, unknown>;
    }

    const lastKey = keys[keys.length - 1];
    // `default: true` → init-if-absent (first-writer-wins); never clobber an
    // existing value. Used by `seed` so two components seeding the same
    // path don't overwrite each other, and user edits survive remounts.
    if (options?.default && current[lastKey] !== undefined) return;
    current[lastKey] = value;
  }

  function wrap<U>(obj: U, path: PropertyKey[] = []): U {
    if (obj === null || typeof obj !== "object") return obj;
    // The cache is keyed by object, and the wrap path is baked in at first
    // wrap. Invariant: an object lives at exactly one scope path — aliasing
    // the same object under two paths (or moving it) is a host bug; writes
    // through the alias would emit on the first path.
    if (proxyCache.has(obj as object))
      return proxyCache.get(obj as object) as U;

    const proxy = new Proxy(obj as object, {
      get(target, prop, receiver) {
        if (path.length === 0) {
          if (prop === "$emitter") return emitter;
          if (prop === "$set") return set;
        }
        const value = Reflect.get(target, prop, receiver);

        // Proxy invariant: for non-configurable, non-writable properties
        // the trap MUST return the exact target value.
        if (value !== null && typeof value === "object") {
          const desc = Object.getOwnPropertyDescriptor(target, prop);
          if (desc && !desc.configurable && !desc.writable) {
            return value;
          }
        }

        return wrap(value, path.concat(prop));
      },

      set(target, prop, value, receiver) {
        const oldValue = (target as Record<PropertyKey, unknown>)[prop];
        const result = Reflect.set(target, prop, value, receiver);

        if (oldValue !== value) {
          const fullPath = path.concat(prop).join(".");
          emitter.emit(fullPath, {
            path: fullPath,
            value,
            oldValue,
          });
        }

        return result;
      },
    }) as U;

    proxyCache.set(obj as object, proxy as object);
    return proxy;
  }

  const proxy = wrap(target) as ReactiveProxy<T>;

  return proxy;
}

export {
  createProxyScope,
  createEmitter,
  type Emitter,
  type ChangePayload,
  type EventHandler,
  type ReactiveProxy,
};
