type EventHandler<T = unknown> = (payload: T) => void;

interface ChangePayload<T = unknown> {
  path: string;
  value: T;
  oldValue: T;
}

interface Emitter {
  on<T = unknown>(type: string, handler: EventHandler<T>): () => void;
  off<T = unknown>(type: string, handler: EventHandler<T>): void;
  emit<T = unknown>(type: string, payload: T): void;
}

function createEmitter(): Emitter {
  const events = new Map<string, Set<EventHandler<any>>>();

  return {
    on(type, handler) {
      const handlers = events.get(type);
      if (handlers) handlers.add(handler);
      else events.set(type, new Set([handler]));
      return () => events.get(type)?.delete(handler);
    },

    off(type, handler) {
      events.get(type)?.delete(handler);
    },

    emit(type, payload) {
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
    let current: any = proxy;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (current[key] === undefined || current[key] === null) {
        current[key] = {};
      }
      current = current[key];
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
          emitter.emit<ChangePayload>(fullPath, {
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
