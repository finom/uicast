// Tools run inside the generated UI and call the REST API over real HTTP.
// Relative paths (base "") hit the same origin in the browser; set
// NEXT_PUBLIC_API_BASE for server-side / cross-origin use.
import { showToast } from "@/components/toaster";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";

// Whose copy of the data GETs read — the slug of the page/chat owner being
// viewed. Writes ignore it: they always act as the session user, so viewing
// someone else's page is read-only by construction.
let apiOwner: string | null = null;
export function setApiOwner(slug: string | null) {
  apiOwner = slug;
}

// Every seed and callback fetch passes through here, so the count of in-flight
// requests is how a freshly mounted document says it is still filling up.
let inFlight = 0;
const watchers = new Set<(inFlight: number) => void>();

export function watchApiActivity(watcher: (inFlight: number) => void) {
  watchers.add(watcher);
  return () => void watchers.delete(watcher);
}

function track(delta: number) {
  inFlight += delta;
  for (const watcher of watchers) watcher(inFlight);
}

export async function apiFetch(
  path: string,
  init?: { method?: string; body?: unknown; success?: string },
) {
  track(1);
  try {
    return await request(path, init);
  } finally {
    track(-1);
  }
}

async function request(
  path: string,
  init?: { method?: string; body?: unknown; success?: string },
) {
  const method = init?.method ?? "GET";
  const ownered =
    method === "GET" && apiOwner
      ? `${path}${path.includes("?") ? "&" : "?"}u=${encodeURIComponent(apiOwner)}`
      : path;
  const res = await fetch(`${API_BASE}${ownered}`, {
    method,
    headers: init?.body !== undefined ? { "content-type": "application/json" } : undefined,
    body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
  if (!res.ok) {
    // Surface the route's own `error` — a message string, or zod issues from
    // request validation — so it reaches the error slot and the recovery
    // prompt instead of a bare status line.
    const body = (await res.json().catch(() => null)) as { error?: unknown } | null;
    const error = body?.error;
    if (typeof error === "string") throw new Error(error);
    if (Array.isArray(error)) {
      const issues = error
        .map((issue) => `${issue?.path?.join?.(".") || "body"}: ${issue?.message ?? JSON.stringify(issue)}`)
        .join("; ");
      throw new Error(`${method} ${path} → ${res.status}: ${issues}`);
    }
    throw new Error(`${method} ${path} → ${res.status}`);
  }
  if (init?.success) showToast(init.success);
  return res.json();
}

// `?a=1&b=x` from an input object; absent values are not sent, an empty object yields "".
export function query(params: Record<string, unknown>) {
  const entries = Object.entries(params).flatMap(([k, v]) => (v === undefined ? [] : [[k, String(v)]]));
  const qs = new URLSearchParams(entries).toString();
  return qs ? `?${qs}` : "";
}
