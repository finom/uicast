import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "@/db";
import { sessions, users, type User } from "@/db/schema";
import { insertSeedContent } from "@/db/seed-content";
import { insertStarterData } from "@/db/starter-data";

// Identity is our own session cookie: OpenRouter's PKCE flow returns a key but
// no user id, so a fresh browser + login = a fresh user with empty content.

const SESSION_COOKIE = "sid";
const SESSION_TTL_MS = 90 * 86_400_000;

/** The seed user owning the public demo content. */
export const SYSTEM_SLUG = "uicast";

const ADJECTIVES = [
  "amber", "brisk", "cedar", "dapper", "ember", "fjord", "gentle", "hazel",
  "indigo", "jade", "keen", "lunar", "mellow", "nimble", "ochre", "pale",
  "quiet", "rustic", "sable", "tidal", "umber", "vivid", "wry", "zesty",
];
const ANIMALS = [
  "falcon", "otter", "lynx", "heron", "badger", "wren", "marten", "ibex",
  "plover", "stoat", "kestrel", "vole", "swift", "tern", "pika", "saiga",
];

function randomSlug(): string {
  const pick = (arr: readonly string[]) => arr[randomBytes(1)[0] % arr.length];
  const n = (randomBytes(2).readUInt16BE(0) % 90) + 10;
  return `${pick(ADJECTIVES)}-${pick(ANIMALS)}-${n}`;
}

async function uniqueSlug(): Promise<string> {
  for (let i = 0; i < 20; i++) {
    const slug = randomSlug();
    const [taken] = await db.select({ id: users.id }).from(users).where(eq(users.slug, slug));
    if (!taken && slug !== SYSTEM_SLUG) return slug;
  }
  return `user-${randomBytes(6).toString("base64url")}`;
}

export async function createUser(): Promise<User> {
  const [user] = await db.insert(users).values({ slug: await uniqueSlug() }).returning();
  await insertStarterData(user.id);
  // New accounts start from the demo content, as their own editable copy.
  await insertSeedContent(user.id, () => crypto.randomUUID());
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

/** The signed-in user, or null. */
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

/**
 * Whose data a read serves: the `u` slug when given, else the session user,
 * else the seed user. Everything is world-readable; this only picks the copy.
 */
export async function resolveOwner(url: URL): Promise<User | null> {
  const slug = url.searchParams.get("u");
  if (slug) return getUserBySlug(slug);
  return (await getSessionUser()) ?? getUserBySlug(SYSTEM_SLUG);
}

/** 401 body for a mutating route hit without a session — worded for the error slot. */
export const READONLY_ERROR =
  "You're viewing the demo data. Log in with OpenRouter to get your own copy and make changes.";
