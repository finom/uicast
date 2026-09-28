// Examples for an empty chat and for the new-page form; each one is answerable with the demo's host functions.
const CHAT_SUGGESTIONS = [
  "Which products are running low?",
  "Stock value by category",
  "Chart units in stock by category",
  "Our 10 most expensive products",
  "Add a new product",
  "Receive stock for a product",
  "Recent stock adjustments",
  "Latest returns in the stock ledger",
  "Chart revenue for the last 30 days",
  "Revenue for the last 7 days",
  "Revenue trend for the last 90 days",
  "Orders by status",
  "Orders waiting for payment",
  "Mark paid orders as shipped",
  "Orders over $500",
  "Largest orders this month",
  "Cancelled orders, newest first",
  "Create an order for a customer",
  "Top 5 customers by spend",
  "Customers with the most orders",
  "Customers with no orders yet",
  "Newest customers",
  "Add a new customer",
  "Look up a customer's orders",
  "Suppliers on a map",
  "Suppliers by lead time",
  "Which supplier ships fastest?",
  "Products grouped by supplier",
  "Add a new supplier",
  "A dashboard for this week",
  "What's our total stock value?",
  "Orders from our top customer",
  "Average order value this month",
  "Best sales day this month",
  "Orders placed today",
  "Which category has the most stock?",
  "Products priced under $50",
  "Products out of stock",
  "Change a product's price",
  "Recently received stock",
  "Log a stock adjustment",
  "Delivered orders this week",
  "Which product sells best?",
  "Update a customer's email",
  "Suppliers based in Europe",
  "Suppliers by category",
  "Which supplier has the most products?",
  "Stock value by supplier",
  "Low-stock items and their suppliers",
  "Compare this week to last week",
];

export type PageIdea = { name: string; prompt: string };

const PAGE_IDEAS: PageIdea[] = [
  {
    name: "Low-stock watchlist",
    prompt:
      "Every product at 10 units or fewer, lowest first, with its supplier and lead time. Let me receive stock for a product right from the list.",
  },
  {
    name: "Stock by category",
    prompt: "Stock value and units per category as a chart and a table, with the low-stock count for each category.",
  },
  {
    name: "Price list",
    prompt: "A searchable price list of every product, sortable by price or name, where I can edit a price in place.",
  },
  {
    name: "Product catalog",
    prompt:
      "A product catalog with search and a category filter, a detail view for each product, and a form to add a product.",
  },
  {
    name: "Receiving desk",
    prompt:
      "A page to receive deliveries: pick a product, enter the quantity and record it in the stock ledger. Show the latest receipts underneath.",
  },
  {
    name: "Stock ledger",
    prompt:
      "The stock ledger, newest first, filterable by reason and product, with totals for received and shipped units.",
  },
  {
    name: "Returns log",
    prompt:
      "Every return in the stock ledger, newest first, with the product and quantity, and a form to log a return.",
  },
  {
    name: "Revenue overview",
    prompt: "Revenue for the last 30 days: a daily chart, the total, the average per day and the best day.",
  },
  {
    name: "Quarterly revenue",
    prompt: "Revenue over the last 90 days as a weekly trend, with a total for each month.",
  },
  {
    name: "Order pipeline",
    prompt:
      "Orders per status as stat cards and a bar chart, with a table of the latest orders that I can filter by status.",
  },
  {
    name: "Payment follow-up",
    prompt: "Pending orders waiting for payment, oldest first, with the customer and total. Let me mark each one paid.",
  },
  {
    name: "Shipping queue",
    prompt: "Paid orders waiting to ship, oldest first, with the customer and product. Let me mark each one shipped.",
  },
  {
    name: "Big orders",
    prompt: "Orders over $500, largest first, with the customer, product, status and date.",
  },
  {
    name: "Cancellations",
    prompt: "Cancelled orders, newest first, with the lost revenue in total and per customer.",
  },
  {
    name: "Order entry",
    prompt:
      "A form to create an order: pick a customer and a product, set the quantity, and see the total before saving. List today's orders below it.",
  },
  {
    name: "Order lookup",
    prompt: "Search orders by customer or product name, filter by status, and open an order to change its status.",
  },
  {
    name: "Top customers",
    prompt: "The top 10 customers by lifetime spend as a bar chart, with their order counts in a table.",
  },
  {
    name: "Customer directory",
    prompt:
      "A customer directory with search, the lifetime value and order count of each customer, and forms to add or edit a customer.",
  },
  {
    name: "New customers",
    prompt: "The customers who joined most recently, with their order count and what they have spent so far.",
  },
  {
    name: "Customers to follow up",
    prompt: "Customers with no orders yet, with their contact details, newest first.",
  },
  {
    name: "Customer detail",
    prompt: "Look up a customer and see their details, every order they placed, and their lifetime value.",
  },
  {
    name: "Supplier map",
    prompt: "Every supplier on a map by city, with a table of suppliers, their category and lead time.",
  },
  {
    name: "Supplier lead times",
    prompt: "Suppliers ranked by lead time as a bar chart, with the number of products each one supplies.",
  },
  {
    name: "Supplier directory",
    prompt: "A supplier directory with search and a category filter, and forms to add or edit a supplier.",
  },
  {
    name: "Products by supplier",
    prompt: "Products grouped by supplier, with the units in stock and the stock value for each supplier.",
  },
  {
    name: "Weekly dashboard",
    prompt: "A dashboard for this week: revenue, orders by status, low-stock products and the newest customers.",
  },
  {
    name: "Daily operations",
    prompt: "One page for the day: orders to ship, payments to chase, and products to reorder.",
  },
  {
    name: "Category deep dive",
    prompt: "Pick a category and see its products, its stock value, its low-stock items and its recent orders.",
  },
  {
    name: "Sales by product",
    prompt: "Orders from the last 30 days grouped by product, with the units sold and the revenue for each product.",
  },
  {
    name: "Reorder planner",
    prompt:
      "Products low on stock with their supplier's lead time, most urgent first, with a button to record a delivery.",
  },
];

// Runs on the server per request, so every reload shows a different set.
function pick<T>(items: T[], count = 4) {
  const pool = [...items];
  return Array.from({ length: count }, () => pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
}

export const pickChatSuggestions = (asked: string[] = []) => pick(CHAT_SUGGESTIONS.filter((s) => !asked.includes(s)));
export const pickPageIdeas = () => pick(PAGE_IDEAS);
