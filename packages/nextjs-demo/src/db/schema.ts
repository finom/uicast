import type { ComponentEntry } from "@uicast/core";
import { relations, sql } from "drizzle-orm";
import { type AnySQLiteColumn, index, integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  sku: text("sku").notNull(),
  category: text("category").notNull(),
  stock: integer("stock").notNull().default(0),
  price: real("price").notNull(),
});

export const customers = sqliteTable("customers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  company: text("company").notNull(),
  email: text("email").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const ORDER_STATUSES = ["pending", "paid", "shipped", "delivered", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const orders = sqliteTable("orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  customerId: integer("customer_id")
    .notNull()
    .references(() => customers.id),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id),
  productName: text("product_name").notNull(),
  qty: integer("qty").notNull(),
  unitPrice: real("unit_price").notNull(),
  total: real("total").notNull(),
  status: text("status", { enum: ORDER_STATUSES }).notNull().default("pending"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const customersRelations = relations(customers, ({ many }) => ({
  orders: many(orders),
}));

export const productsRelations = relations(products, ({ many }) => ({
  orders: many(orders),
}));

export const ordersRelations = relations(orders, ({ one }) => ({
  customer: one(customers, { fields: [orders.customerId], references: [customers.id] }),
  product: one(products, { fields: [orders.productId], references: [products.id] }),
}));

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;

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
