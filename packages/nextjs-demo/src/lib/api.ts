import type { ZodType } from "zod";
import type { User } from "@/db/schema";
import { getSessionUser, READONLY_ERROR, resolveOwner } from "./auth";

export function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}

function validated<T>(schema: ZodType<T>, value: unknown): { data: T } | { error: Response } {
  const parsed = schema.safeParse(value);
  return parsed.success ? { data: parsed.data } : { error: json({ error: parsed.error.issues }, 400) };
}

export async function readValid<T>(req: Request, schema: ZodType<T>) {
  return validated(schema, await req.json().catch(() => undefined));
}

/** The query-string twin of `readValid`; a `z.object` drops the `u=` owner param. */
export function readQuery<T>(req: Request, schema: ZodType<T>) {
  return validated(schema, Object.fromEntries(new URL(req.url).searchParams));
}

export async function idParam(params: Promise<{ id: string }>) {
  return Number((await params).id);
}

/** Reads: whose copy of the data to serve (`?u=` slug > session > seed user). */
export async function ownerForRead(
  req: Request,
): Promise<{ owner: User } | { error: Response }> {
  const owner = await resolveOwner(new URL(req.url));
  if (!owner) return { error: json({ error: "Unknown user" }, 404) };
  return { owner };
}

/** Writes: the session user, or a 401 whose message reads well in the error slot. */
export async function requireUser(): Promise<{ me: User } | { error: Response }> {
  const me = await getSessionUser();
  if (!me) return { error: json({ error: READONLY_ERROR }, 401) };
  return { me };
}
