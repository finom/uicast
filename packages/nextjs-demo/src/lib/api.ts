import { type ZodType } from "zod";

export function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}

export async function readValid<T>(
  req: Request,
  schema: ZodType<T>,
): Promise<{ data: T } | { error: Response }> {
  const body = await req.json().catch(() => undefined);
  const parsed = schema.safeParse(body);
  if (parsed.success) return { data: parsed.data };
  return { error: json({ error: parsed.error.issues }, 400) };
}

export async function idParam(params: Promise<{ id: string }>) {
  return Number((await params).id);
}
