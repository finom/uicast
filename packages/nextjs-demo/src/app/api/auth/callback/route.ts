import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "@/db";
import { users } from "@/db/schema";
import {
  createSession,
  createUser,
  getSessionUser,
  setSessionCookie,
} from "@/lib/auth";
import { encryptSecret } from "@/lib/crypto";

// PKCE step 2: the code and the verifier are exchanged for the key.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const store = await cookies();
  const verifier = store.get("pkce_verifier")?.value;
  store.delete("pkce_verifier");
  if (!code || !verifier) {
    return Response.redirect(new URL("/?login=failed", req.url), 302);
  }

  const res = await fetch("https://openrouter.ai/api/v1/auth/keys", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ code, code_verifier: verifier, code_challenge_method: "S256" }),
  });
  const body = (await res.json().catch(() => null)) as { key?: string } | null;
  if (!res.ok || !body?.key) {
    return Response.redirect(new URL("/?login=failed", req.url), 302);
  }

  // Before the account exists: without APP_SECRET this throws, and no keyless account is left behind.
  const openrouterKeyEnc = encryptSecret(body.key);
  let user = await getSessionUser();
  if (!user) {
    user = await createUser();
    await setSessionCookie(await createSession(user.id));
  }
  await db.update(users).set({ openrouterKeyEnc }).where(eq(users.id, user.id));

  return Response.redirect(new URL(`/u/${user.slug}`, req.url), 302);
}
