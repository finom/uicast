import "@testing-library/jest-dom/vitest";

// happy-dom installs its own realm's `Promise`, which (as of 20.x) predates
// ES2024's `Promise.withResolvers` — used by the confirm host. Node itself has
// it; only the test realm needs the patch.
if (typeof Promise.withResolvers !== "function") {
  Promise.withResolvers = <T>() => {
    let resolve!: (value: T | PromiseLike<T>) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };
}
