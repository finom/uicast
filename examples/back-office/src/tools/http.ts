import { showToast } from "@/components/toaster";

// Writes ignore it: they act as the session user, so viewing someone else's page is read-only.
let apiOwner: string | null = null;
export function setApiOwner(slug: string) {
  apiOwner = slug;
}

type ApiInit = { method?: string; body?: unknown; success?: string };

export async function apiFetch(path: string, init?: ApiInit) {
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
      const issues = error.map((issue) => `${issue.path.join(".") || "body"}: ${issue.message}`).join("; ");
      throw new Error(`${method} ${path} → ${res.status}: ${issues}`);
    }
    throw new Error(`${method} ${path} → ${res.status}`);
  }
  if (init?.success) showToast(init.success, "success");
  return res.json();
}

export function query(params: Record<string, unknown>) {
  const entries = Object.entries(params).flatMap(([k, v]) => (v === undefined ? [] : [[k, String(v)]]));
  const qs = new URLSearchParams(entries).toString();
  return qs ? `?${qs}` : "";
}
