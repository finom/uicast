import type { ComponentEntry } from "@uicast/core";
import { relations, sql } from "drizzle-orm";
import { type AnySQLiteColumn, index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";


/**
 * An external API the user connected by asking for it in chat.
 *
 * There is no registry and no discovery service: the model recalls the API's
 * OpenAPI document URL and how it authenticates, renders a form saying so, and
 * the user's Save writes this row. Everything the runtime needs to call the API
 * later is here.
 *
 * `credential` is stored in plain text. This is a proof of concept run locally
 * against test keys — a real product encrypts it and never lets it back out.
 */
export const connections = sqliteTable("connections", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  // Prefixes every derived tool name, so two APIs can both expose `search`.
  name: text("name").notNull().unique(),
  openapiUrl: text("openapi_url").notNull(),
  // How the credential rides on the request. `none` covers open APIs, which is
  // the whole auth story for the first slice.
  authType: text("auth_type", { enum: ["none", "header", "query"] })
    .notNull()
    .default("none"),
  // Header or query-parameter name, e.g. `Authorization` or `api_key`.
  authName: text("auth_name"),
  // Prepended to the credential, e.g. `Bearer `.
  authPrefix: text("auth_prefix"),
  credential: text("credential"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export type Connection = typeof connections.$inferSelect;
export type NewConnection = typeof connections.$inferInsert;

export const pages = sqliteTable("pages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  icon: text("icon"),
  position: integer("position").notNull().default(0),
  prompt: text("prompt"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const componentEntries = sqliteTable(
  "component_entries",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    pageId: integer("page_id")
      .notNull()
      .references(() => pages.id, { onDelete: "cascade" }),
    parentId: integer("parent_id").references((): AnySQLiteColumn => componentEntries.id, {
      onDelete: "cascade",
    }),
    data: text("data", { mode: "json" }).$type<ComponentEntry>().notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch('subsec') * 1000)`),
  },
  (t) => [
    index("component_entries_page_created").on(t.pageId, t.createdAt),
    index("component_entries_parent").on(t.parentId),
  ],
);

export const pagesRelations = relations(pages, ({ many }) => ({
  entries: many(componentEntries),
}));

export const componentEntriesRelations = relations(componentEntries, ({ one, many }) => ({
  page: one(pages, { fields: [componentEntries.pageId], references: [pages.id] }),
  parent: one(componentEntries, {
    fields: [componentEntries.parentId],
    references: [componentEntries.id],
    relationName: "entry_children",
  }),
  children: many(componentEntries, { relationName: "entry_children" }),
}));

export type Page = typeof pages.$inferSelect;
export type NewPage = typeof pages.$inferInsert;
export type ComponentEntryRow = typeof componentEntries.$inferSelect;
export type NewComponentEntryRow = typeof componentEntries.$inferInsert;

export const chats = sqliteTable("chats", {
  // The id comes from the client (useChat's generated uuid), so the chat row
  // can be created lazily on the first message without an id handshake.
  id: text("id").primaryKey(),
  title: text("title").notNull().default("New chat"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const chatMessages = sqliteTable(
  "chat_messages",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    chatId: text("chat_id")
      .notNull()
      .references(() => chats.id, { onDelete: "cascade" }),
    // UIMessage id from the AI SDK, preserved so reloads restore the exact
    // message identities useChat expects.
    messageId: text("message_id").notNull(),
    role: text("role", { enum: ["user", "assistant", "system"] }).notNull(),
    // UIMessage.parts, stored verbatim.
    parts: text("parts", { mode: "json" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch('subsec') * 1000)`),
  },
  (t) => [index("chat_messages_chat_created").on(t.chatId, t.createdAt)],
);

export const chatsRelations = relations(chats, ({ many }) => ({
  messages: many(chatMessages),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  chat: one(chats, { fields: [chatMessages.chatId], references: [chats.id] }),
}));

export type Chat = typeof chats.$inferSelect;
export type ChatMessageRow = typeof chatMessages.$inferSelect;
