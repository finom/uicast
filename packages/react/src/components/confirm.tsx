"use client";
import { createContext, useContext } from "react";

/**
 * Confirm seam — the SYSTEM half of the confirm flow.
 *
 * `createAIComponentRenderer` calls `useConfirm()` before running any callback
 * `set` entry that carries a `confirm:` message. By default that resolves to
 * the browser-native `window.confirm`, so the engine works with zero UI
 * dependencies. A consumer overrides it by wrapping the tree in
 * `<ConfirmProvider value={…}>` with any async `(message) => Promise<boolean>`
 * — e.g. the shadcn `ConfirmModalProvider` shipped from `@ui-fired/catalog`.
 */
export type ConfirmFn = (message: string) => Promise<boolean>;

// `window` is only touched when the fn is *called* (always from a client-side
// callback), but the guard keeps the module import-safe during SSR.
const windowConfirm: ConfirmFn = (message) =>
  Promise.resolve(
    typeof window !== "undefined" ? window.confirm(message) : true,
  );

const ConfirmContext = createContext<ConfirmFn>(windowConfirm);

/** The active confirm fn — `window.confirm` unless a provider overrides it. */
export const useConfirm = (): ConfirmFn => useContext(ConfirmContext);

/** Override seam: supply a custom `ConfirmFn` (e.g. a modal-backed one). */
export const ConfirmProvider = ConfirmContext.Provider;
