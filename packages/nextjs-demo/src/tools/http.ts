import { showToast } from "@/components/toaster";

// Writes ignore it: they act as the session user, so viewing someone else's page is read-only.
let apiOwner: string | null = null;
export function setApiOwner(slug: string) {
  apiOwner = slug;
}

// The count of in-flight requests is how a freshly mounted document says it is still filling up.
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

type ApiInit = { method?: string; body?: unknown; success?: string };

export async function apiFetch(path: string, init?: ApiInit) {
  track(1);
  try {
    return await request(path, init);
  } finally {
    track(-1);
  }
}

async function request(path: string, init?: ApiInit) {
  const method = init?.method ?? "GET";
  let url = path;
  if (method === "GET" && apiOwner) url += `${path.includes("?") ? "&" : "?"}u=${encodeURIComponent(apiOwner)}`;
  const res = await fetch(url, {
    method,
    headers: init?.body !== undefined ? { "content-type": "application/json" } : undefined,
    body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
  if (!res.ok) {
    // The route's own `error` (a message, or zod issues) reaches the error slot and the recovery prompt.
    const body = (await res.json().catch(() => null)) as { error?: unknown } | null;
    const error = body?.error;
    if (typeof error === "string") throw new Error(error);
    if (Array.isArray(error)) {
      const issues = error
        .map((issue) => `${issue.path.join(".") || "body"}: ${issue.message}`)
        .join("; ");
      throw new Error(`${method} ${path} → ${res.status}: ${issues}`);
    }
    throw new Error(`${method} ${path} → ${res.status}`);
  }
  if (init?.success) showToast(init.success);
  return res.json();
}

export function query(params: Record<string, unknown>) {
  const entries = Object.entries(params).flatMap(([k, v]) => (v === undefined ? [] : [[k, String(v)]]));
  const qs = new URLSearchParams(entries).toString();
  return qs ? `?${qs}` : "";
}
