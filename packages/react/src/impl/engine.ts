import type { ComponentImplementation, ImplementationEngine } from "../types";

// Filled only by `createComponentImplementation`, so the engine never shows on the public type.
const engines = new WeakMap<ComponentImplementation, ImplementationEngine>();

export const attachEngine = (impl: ComponentImplementation, engine: ImplementationEngine): void => {
  engines.set(impl, engine);
};

export const engineOf = (impl: ComponentImplementation): ImplementationEngine => {
  const engine = engines.get(impl);
  if (!engine) {
    throw new Error(
      `[uicast] The implementation of "${impl.def.name}" was not made by createComponentImplementation from this copy of @uicast/react.`,
    );
  }
  return engine;
};
