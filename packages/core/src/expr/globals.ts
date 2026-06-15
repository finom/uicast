// Which JavaScript globals an expression can see. ALLOWED_GLOBALS stay visible
// (passed to SafeEval as allowGlobals, and listed for the LLM in the prompt);
// GLOBALS_TO_SHADOW are bound to undefined so an expression can't reach them.
// Anything in neither list resolves to undefined anyway — shadowing only matters
// for the dangerous capability globals.

/** Globals an expression may reference. Every entry is also usable with `new`. */
export const ALLOWED_GLOBALS: string[] = [
  // Namespaces / utilities
  "Math",
  "JSON",
  "Intl",
  "Object",
  "Array",
  // Coercion (use as calls — `new Number(x)` etc. boxes the value)
  "Number",
  "String",
  "Boolean",
  "parseInt",
  "parseFloat",
  // Predicates / constants
  "isNaN",
  "isFinite",
  "undefined",
  "NaN",
  "Infinity",
  // URI helpers
  "encodeURIComponent",
  "decodeURIComponent",
  "encodeURI",
  "decodeURI",
  // Constructors & async
  "Date",
  "Map",
  "Set",
  "RegExp",
  "URL",
  "URLSearchParams",
  "Promise",
  "BigInt",
];

// Capability globals shadowed to undefined. (`eval` / `arguments` can't be param
// names in strict mode — blocked in validate.ts instead.)
export const GLOBALS_TO_SHADOW: string[] = [
  // Global objects
  "globalThis",
  "self",
  "window",
  "global",
  "document",
  "navigator",
  "location",
  "history",
  "localStorage",
  "sessionStorage",
  "indexedDB",

  // Network / IO
  "fetch",
  "XMLHttpRequest",
  "WebSocket",
  "EventSource",
  "Worker",
  "SharedWorker",
  "ServiceWorker",
  "importScripts",
  // Fire a network request via `.src` — an exfiltration channel even with fetch
  // shadowed.
  "Image",
  "Audio",

  // Code execution
  "Function",
  "WebAssembly", // runs arbitrary code
  "setTimeout",
  "setInterval",
  "setImmediate",
  "requestAnimationFrame",
  "requestIdleCallback",
  "queueMicrotask",

  // Process / non-browser runtimes
  "process",
  "require",
  "module",
  "exports",
  "__dirname",
  "__filename",
  "Buffer",
  "Deno", // runtime god-object (fs/net/env) outside a browser
  "Bun",

  // DOM
  "alert",
  "confirm",
  "prompt",
  "close",
  "open",
  "print",
  "postMessage",

  // Constructors that can escape
  "Proxy",
  "Reflect",
  "SharedArrayBuffer",
  "Atomics",
];
