import type { ComponentEntry } from "@uicast/core";
import { index, integer, jsonb, pgTable, real, serial, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

// Every user owns a full copy of the domain data. Everything is world-readable; writes are owner-only.

const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const ownerId = () =>
  uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" });

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  // OpenRouter key, AES-256-GCM under APP_SECRET (`iv.tag.cipher`, base64url).
  openrouterKeyEnc: text("openrouter_key_enc"),
  createdAt: createdAt(),
});

export type User = typeof users.$inferSelect;

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: ownerId(),
  createdAt: createdAt(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

export const suppliers = pgTable(
  "suppliers",
  {
    id: serial("id").primaryKey(),
    userId: ownerId(),
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
    userId: ownerId(),
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
    userId: ownerId(),
    name: text("name").notNull(),
    company: text("company").notNull(),
    email: text("email").notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("customers_user").on(t.userId)],
);

export const ORDER_STATUSES = ["pending", "paid", "shipped", "delivered", "cancelled"] as const;

export const orders = pgTable(
  "orders",
  {
    id: serial("id").primaryKey(),
    userId: ownerId(),
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
    createdAt: createdAt(),
  },
  (t) => [index("orders_user").on(t.userId)],
);

export const MOVEMENT_REASONS = ["received", "shipped", "adjustment", "returned"] as const;

// Creating a movement adjusts the product's `stock` in the same transaction.
export const stockMovements = pgTable(
  "stock_movements",
  {
    id: serial("id").primaryKey(),
    userId: ownerId(),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    // Positive = stock in, negative = stock out.
    qty: integer("qty").notNull(),
    reason: text("reason", { enum: MOVEMENT_REASONS }).notNull(),
    note: text("note"),
    createdAt: createdAt(),
  },
  (t) => [index("stock_movements_user_created").on(t.userId, t.createdAt)],
);

export const pages = pgTable(
  "pages",
  {
    id: serial("id").primaryKey(),
    userId: ownerId(),
    // A seeded page's URL id, so its links survive a reseed.
    seedId: text("seed_id"),
    title: text("title").notNull(),
    prompt: text("prompt"),
    // The model of the latest generation run.
    model: text("model"),
    // Accumulated across every generation run of this page.
    inputTokens: integer("input_tokens").notNull().default(0),
    outputTokens: integer("output_tokens").notNull().default(0),
    costUsd: real("cost_usd").notNull().default(0),
    createdAt: createdAt(),
  },
  (t) => [index("pages_user").on(t.userId), uniqueIndex("pages_user_seed").on(t.userId, t.seedId)],
);

export const componentEntries = pgTable(
  "component_entries",
  {
    id: serial("id").primaryKey(),
    pageId: integer("page_id")
      .notNull()
      .references(() => pages.id, { onDelete: "cascade" }),
    data: jsonb("data").$type<ComponentEntry>().notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("component_entries_page_created").on(t.pageId, t.createdAt)],
);

export const chats = pgTable(
  "chats",
  {
    // The client mints the id, so the row can be created lazily on the first message.
    id: text("id").primaryKey(),
    userId: ownerId(),
    title: text("title").notNull().default("New chat"),
    createdAt: createdAt(),
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
    // Preserved so reloads restore the message identities useChat expects.
    messageId: text("message_id").notNull(),
    role: text("role", { enum: ["user", "assistant", "system"] }).notNull(),
    parts: jsonb("parts").notNull(),
    // UIMessage.metadata without `model`: per-message usage and cost on assistant rows.
    metadata: jsonb("metadata"),
    // The model that wrote an assistant row.
    model: text("model"),
    createdAt: createdAt(),
  },
  (t) => [index("chat_messages_chat_created").on(t.chatId, t.createdAt)],
);
