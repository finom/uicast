import { randomInt } from "node:crypto";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "@/db";
import { sessions, users, type User } from "@/db/schema";
import { insertStarterData } from "@/db/starter-data";
import { SYSTEM_SLUG } from "@/lib/system-slug";

// OpenRouter's PKCE flow returns a key but no user id, so identity is our own session cookie.

const SESSION_COOKIE = "sid";
const SESSION_TTL_MS = 90 * 86_400_000;

const ADJECTIVES = [
  "amber",
  "brisk",
  "cedar",
  "dapper",
  "ember",
  "fjord",
  "gentle",
  "hazel",
  "indigo",
  "jade",
  "keen",
  "lunar",
  "mellow",
  "nimble",
  "ochre",
  "pale",
  "quiet",
  "rustic",
  "sable",
  "tidal",
  "umber",
  "vivid",
  "wry",
  "zesty",
];
const ANIMALS = [
  "falcon",
  "otter",
  "lynx",
  "heron",
  "badger",
  "wren",
  "marten",
  "ibex",
  "plover",
  "stoat",
  "kestrel",
  "vole",
  "swift",
  "tern",
  "pika",
  "saiga",
];

function randomSlug(): string {
  const pick = (arr: readonly string[]) => arr[randomInt(arr.length)];
  return `${pick(ADJECTIVES)}-${pick(ANIMALS)}-${randomInt(10, 100)}`;
}

async function uniqueSlug(): Promise<string> {
  for (let i = 0; i < 20; i++) {
    const slug = randomSlug();
    const [taken] = await db.select({ id: users.id }).from(users).where(eq(users.slug, slug));
    if (!taken) return slug;
  }
  return `user-${randomBytes(6).toString("base64url")}`;
}

export async function createUser(): Promise<User> {
  const [user] = await db
    .insert(users)
    .values({ slug: await uniqueSlug() })
    .returning();
  // Domain data only: no pages, no chats. The user builds their own.
  await insertStarterData(user.id);
  return user;
}

export async function createSession(userId: string): Promise<string> {
  const id = randomBytes(32).toString("base64url");
  await db.insert(sessions).values({
    id,
    userId,
    expiresAt: new Date(Date.now() + SESSION_TTL_MS),
  });
  return id;
}

export async function setSessionCookie(sessionId: string): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_TTL_MS / 1000,
    path: "/",
  });
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  const sid = store.get(SESSION_COOKIE)?.value;
  if (sid) await db.delete(sessions).where(eq(sessions.id, sid));
  store.delete(SESSION_COOKIE);
}

export async function getSessionUser(): Promise<User | null> {
  const sid = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!sid) return null;
  const [row] = await db
    .select({ user: users, expiresAt: sessions.expiresAt })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.id, sid));
  if (!row) return null;
  if (row.expiresAt.getTime() < Date.now()) {
    await db.delete(sessions).where(eq(sessions.id, sid));
    return null;
  }
  return row.user;
}

export async function getUserBySlug(slug: string): Promise<User | null> {
  const [user] = await db.select().from(users).where(eq(users.slug, slug));
  return user ?? null;
}

export async function resolveOwner(url: URL): Promise<User | null> {
  const slug = url.searchParams.get("u");
  if (slug) return getUserBySlug(slug);
  return (await getSessionUser()) ?? getUserBySlug(SYSTEM_SLUG);
}

// Worded for the error slot.
export const READONLY_ERROR =
  "You're viewing the demo data. Log in with OpenRouter to get your own copy and make changes.";
