// Tools run inside the generated UI and call the REST API over real HTTP.
// Relative paths (base "") hit the same origin in the browser; set
// NEXT_PUBLIC_API_BASE for server-side / cross-origin use.
const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";

export async function apiFetch(path: string, init?: { method?: string; body?: unknown }) {
  const method = init?.method ?? "GET";
  const res = await fetch(`${API_BASE}${path}`, {
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
  return res.json();
}
