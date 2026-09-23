import { getSessionUser } from "@/lib/auth";

export async function GET() {
  const user = await getSessionUser();
  return Response.json(user ? { slug: user.slug } : null);
}
