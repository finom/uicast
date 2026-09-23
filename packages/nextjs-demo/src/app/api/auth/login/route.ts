import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";

// PKCE step 1: the verifier goes into a short-lived cookie.
export async function GET(req: Request) {
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  (await cookies()).set("pkce_verifier", verifier, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 600,
    path: "/",
  });
  const callback = new URL("/api/auth/callback", req.url).toString();
  const target = new URL("https://openrouter.ai/auth");
  target.searchParams.set("callback_url", callback);
  target.searchParams.set("code_challenge", challenge);
  target.searchParams.set("code_challenge_method", "S256");
  return Response.redirect(target, 302);
}
