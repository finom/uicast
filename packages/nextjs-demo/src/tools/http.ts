// Tools run inside the generated UI and call the REST API over real HTTP.
// Relative paths (base "") hit the same origin in the browser; set
// NEXT_PUBLIC_API_BASE for server-side / cross-origin use.
const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";

export async function apiFetch(path: string, init?: { method?: string; body?: unknown }) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: init?.method ?? "GET",
    headers: init?.body !== undefined ? { "content-type": "application/json" } : undefined,
    body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
  if (!res.ok) throw new Error(`${init?.method ?? "GET"} ${path} → ${res.status}`);
  return res.json();
}
