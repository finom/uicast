import { type StandardToolV0, standardTool } from "standard-tool";
import { z } from "zod";

const LATENCY_MS = 350;
const wait = () => new Promise((resolve) => setTimeout(resolve, LATENCY_MS));

const Status = z.enum(["pending", "paid", "shipped", "refunded"]);
const Order = z.object({
  id: z.number().int(),
  customer: z.string(),
  total: z.number(),
  status: Status,
});
type Order = z.infer<typeof Order>;

const WEEK: Order[] = [
  { id: 1042, customer: "Ana Silva", total: 182.4, status: "paid" },
  { id: 1041, customer: "Ben Okafor", total: 96, status: "paid" },
  { id: 1040, customer: "Chen Wei", total: 240, status: "refunded" },
  { id: 1039, customer: "Dana Kim", total: 58.5, status: "shipped" },
  { id: 1038, customer: "Erik Lund", total: 131.2, status: "shipped" },
];

const WAREHOUSES = [
  { city: "Rotterdam", lat: 51.92, lng: 4.48, units: 18420, lowStockItems: 3, shippedToday: 212 },
  { city: "Berlin", lat: 52.52, lng: 13.4, units: 21040, lowStockItems: 1, shippedToday: 243 },
  { city: "Paris", lat: 48.86, lng: 2.35, units: 15210, lowStockItems: 5, shippedToday: 187 },
  { city: "Warsaw", lat: 52.23, lng: 21.01, units: 12380, lowStockItems: 4, shippedToday: 131 },
  { city: "Milan", lat: 45.46, lng: 9.19, units: 9870, lowStockItems: 7, shippedToday: 96 },
  { city: "Vienna", lat: 48.21, lng: 16.37, units: 7650, lowStockItems: 2, shippedToday: 88 },
];

const SLOT_TIMES = ["09:00", "11:00", "13:00", "15:00", "17:00", "19:00"];

// Unsplash photos, served by its CDN at 320 px.
const photo = (id: string) => `https://images.unsplash.com/photo-${id}?w=320&h=320&fit=crop&auto=format&q=70`;

const PRODUCTS = [
  { id: 1, name: "House blend", price: 12.5, image: photo("1524350876685-274059332603") },
  { id: 2, name: "Espresso roast", price: 14, image: photo("1509785307050-d4066910ec1e") },
  { id: 3, name: "Ceramic mug", price: 9, image: photo("1520485521983-bfaa0bc6c80e") },
];

// In memory: a reload or a replay starts from the same data.
let orders = WEEK;
let booked = new Set<string>();

export const resetData = () => {
  orders = WEEK;
  booked = new Set();
};

const setStatus = (id: number, status: Order["status"]) => {
  orders = orders.map((order) => (order.id === id ? { ...order, status } : order));
};

const listOrders = standardTool({
  name: "listOrders",
  description: "Every order this week, newest first.",
  outputSchema: z.array(Order),
  async execute() {
    await wait();
    return orders;
  },
});

const refundOrder = standardTool({
  name: "refundOrder",
  description: "Refund one order.",
  inputSchema: z.object({ id: z.number().int() }),
  async execute({ id }) {
    await wait();
    setStatus(id, "refunded");
  },
});

const updateOrder = standardTool({
  name: "updateOrder",
  description: "Change one order's status.",
  inputSchema: z.object({ id: z.number().int(), status: Status }),
  async execute({ id, status }) {
    await wait();
    setStatus(id, status);
  },
});

const listProducts = standardTool({
  name: "listProducts",
  description: "Everything the shop sells.",
  outputSchema: z.array(z.object({ id: z.number().int(), name: z.string(), price: z.number(), image: z.url() })),
  async execute() {
    await wait();
    return PRODUCTS;
  },
});

const placeOrder = standardTool({
  name: "placeOrder",
  description: "Order these products, one id per item.",
  inputSchema: z.object({ productIds: z.array(z.number().int()) }),
  outputSchema: z.object({ id: z.number().int() }),
  async execute({ productIds }) {
    await wait();
    const id = Math.max(...orders.map((order) => order.id)) + 1;
    const total = productIds.reduce(
      (sum, productId) => sum + (PRODUCTS.find((p) => p.id === productId)?.price ?? 0),
      0,
    );
    orders = [{ id, customer: "Shop visitor", total, status: "paid" }, ...orders];
    return { id };
  },
});

const listWarehouses = standardTool({
  name: "listWarehouses",
  description: "Every warehouse, with its stock.",
  outputSchema: z.array(
    z.object({
      city: z.string(),
      lat: z.number(),
      lng: z.number(),
      units: z.number().int(),
      lowStockItems: z.number().int(),
      shippedToday: z.number().int(),
    }),
  ),
  async execute() {
    await wait();
    return WAREHOUSES;
  },
});

// A local `YYYY-MM-DD`; `toISOString` would give the UTC date.
const isoDate = (d: Date) =>
  [d.getFullYear(), d.getMonth() + 1, d.getDate()].map((n) => String(n).padStart(2, "0")).join("-");

const getSlots = standardTool({
  name: "getSlots",
  description: "Delivery slots on one day, from tomorrow on. Tomorrow's when no date is given.",
  inputSchema: z.object({ date: z.iso.date().optional() }),
  outputSchema: z.object({
    date: z.iso.date(),
    label: z.string().meta({ description: "The date written out, as in Thu, Oct 2" }),
    slots: z.array(z.object({ time: z.string(), free: z.boolean() })),
  }),
  async execute({ date }) {
    await wait();
    const tomorrow = new Date();
    tomorrow.setHours(0, 0, 0, 0);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const [year, month, dayOfMonth] = (date ?? isoDate(tomorrow)).split("-").map(Number);
    const day = new Date(year, month - 1, dayOfMonth);
    const iso = isoDate(day);
    return {
      date: iso,
      label: day.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
      // Every fourth slot is taken from the start, so the day looks lived-in.
      slots:
        day < tomorrow
          ? []
          : SLOT_TIMES.map((time, i) => ({ time, free: (dayOfMonth + i) % 4 !== 0 && !booked.has(`${iso} ${time}`) })),
    };
  },
});

const bookSlot = standardTool({
  name: "bookSlot",
  description: "Book one delivery slot.",
  inputSchema: z.object({ date: z.iso.date(), time: z.string() }),
  async execute({ date, time }) {
    await wait();
    booked.add(`${date} ${time}`);
  },
});

export const functions: StandardToolV0[] = [
  listOrders,
  refundOrder,
  updateOrder,
  listProducts,
  placeOrder,
  listWarehouses,
  getSlots,
  bookSlot,
];
