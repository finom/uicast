import type { ComponentEntry } from "@uicast/core";
import { relations } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgTable,
  real,
  serial,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

// Every user owns a full copy of the domain data (products / customers /
// orders) plus their pages and chats. The seed user (slug "uicast") owns the
// public demo content; everything is world-readable, writes are owner-only.

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  /** OpenRouter key, AES-256-GCM under APP_SECRET (`iv.tag.cipher`, base64url). */
  openrouterKeyEnc: text("openrouter_key_enc"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

export const suppliers = pgTable(
  "suppliers",
  {
    id: serial("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    email: text("email").notNull(),
    category: text("category").notNull(),
    leadTimeDays: integer("lead_time_days").notNull(),
  },
  (t) => [index("suppliers_user").on(t.userId)],
);

export const products = pgTable(
  "products",
  {
    id: serial("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    supplierId: integer("supplier_id")
      .notNull()
      .references(() => suppliers.id),
    name: text("name").notNull(),
    sku: text("sku").notNull(),
    category: text("category").notNull(),
    stock: integer("stock").notNull().default(0),
    price: real("price").notNull(),
  },
  (t) => [index("products_user").on(t.userId)],
);

export const customers = pgTable(
  "customers",
  {
    id: serial("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    company: text("company").notNull(),
    email: text("email").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("customers_user").on(t.userId)],
);

export const ORDER_STATUSES = ["pending", "paid", "shipped", "delivered", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const orders = pgTable(
  "orders",
  {
    id: serial("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
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
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("orders_user").on(t.userId)],
);

export const MOVEMENT_REASONS = ["received", "shipped", "adjustment", "returned"] as const;
export type MovementReason = (typeof MOVEMENT_REASONS)[number];

// The stock ledger. Creating a movement adjusts the product's `stock` in the
// same transaction, so the ledger and the counter always reconcile.
export const stockMovements = pgTable(
  "stock_movements",
  {
    id: serial("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    /** Positive = stock in, negative = stock out. */
    qty: integer("qty").notNull(),
    reason: text("reason", { enum: MOVEMENT_REASONS }).notNull(),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("stock_movements_user_created").on(t.userId, t.createdAt)],
);

export type Supplier = typeof suppliers.$inferSelect;
export type StockMovement = typeof stockMovements.$inferSelect;

export const usersRelations = relations(users, ({ many }) => ({
  pages: many(pages),
  chats: many(chats),
}));

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

export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;

export const pages = pgTable(
  "pages",
  {
    id: serial("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    prompt: text("prompt"),
    /** Accumulated across every generation run of this page. */
    inputTokens: integer("input_tokens").notNull().default(0),
    outputTokens: integer("output_tokens").notNull().default(0),
    costUsd: real("cost_usd").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("pages_user").on(t.userId)],
);

export const componentEntries = pgTable(
  "component_entries",
  {
    id: serial("id").primaryKey(),
    pageId: integer("page_id")
      .notNull()
      .references(() => pages.id, { onDelete: "cascade" }),
    data: jsonb("data").$type<ComponentEntry>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("component_entries_page_created").on(t.pageId, t.createdAt)],
);

export const pagesRelations = relations(pages, ({ many, one }) => ({
  entries: many(componentEntries),
  user: one(users, { fields: [pages.userId], references: [users.id] }),
}));

export const componentEntriesRelations = relations(componentEntries, ({ one }) => ({
  page: one(pages, { fields: [componentEntries.pageId], references: [pages.id] }),
}));

export type Page = typeof pages.$inferSelect;
export type NewPage = typeof pages.$inferInsert;
export type ComponentEntryRow = typeof componentEntries.$inferSelect;
export type NewComponentEntryRow = typeof componentEntries.$inferInsert;

export const chats = pgTable(
  "chats",
  {
    // The id comes from the client (useChat's generated uuid), so the chat row
    // can be created lazily on the first message without an id handshake.
    id: text("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull().default("New chat"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("chats_user").on(t.userId)],
);

export const chatMessages = pgTable(
  "chat_messages",
  {
    id: serial("id").primaryKey(),
    chatId: text("chat_id")
      .notNull()
      .references(() => chats.id, { onDelete: "cascade" }),
    // UIMessage id from the AI SDK, preserved so reloads restore the exact
    // message identities useChat expects.
    messageId: text("message_id").notNull(),
    role: text("role", { enum: ["user", "assistant", "system"] }).notNull(),
    // UIMessage.parts, stored verbatim.
    parts: jsonb("parts").notNull(),
    /** UIMessage.metadata — carries per-message usage/cost on assistant rows. */
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("chat_messages_chat_created").on(t.chatId, t.createdAt)],
);

export const chatsRelations = relations(chats, ({ many, one }) => ({
  messages: many(chatMessages),
  user: one(users, { fields: [chats.userId], references: [users.id] }),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  chat: one(chats, { fields: [chatMessages.chatId], references: [chats.id] }),
}));

export type Chat = typeof chats.$inferSelect;
export type ChatMessageRow = typeof chatMessages.$inferSelect;
