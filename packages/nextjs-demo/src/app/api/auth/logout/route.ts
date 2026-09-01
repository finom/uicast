import { clearSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  await clearSession();
  return Response.redirect(new URL("/", req.url), 302);
}
