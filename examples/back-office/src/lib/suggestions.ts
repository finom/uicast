// Examples for the chat and for the new-page form. Each one asks for something that changes data, using the demo's host functions.
const CHAT_SUGGESTIONS = [
  // Orders
  "Create an order for a customer",
  "Mark pending orders as paid",
  "Ship paid orders, one click each",
  "Mark shipped orders as delivered",
  "Cancel an order, with a confirm step",
  "Change the quantity of a pending order",
  "Swap an order to a different product",
  "Delete a cancelled order",
  "Orders kanban: drag to change status",
  "Repeat a customer's last order",
  // Products
  "Add a new product",
  "Add a product with opening stock",
  "Duplicate a product with a new SKU",
  "Change a product's price",
  "Discount a product by 15%",
  "Edit prices in a searchable table",
  "Move a product to another supplier",
  "Move a product to another category",
  "Rename a product",
  "Mark a product as out of stock",
  // Stock
  "Receive a delivery for a product",
  "Restock low-stock products",
  "Log a customer return",
  "Log a stock adjustment with a note",
  "Correct a product's stock count",
  "Write off damaged units",
  "Undo the last stock movement",
  // Customers
  "Add a new customer",
  "Update a customer's email",
  "Change a customer's company",
  "Add a customer, then an order for them",
  "Delete a customer with no orders",
  "Edit customers in a table",
  // Suppliers
  "Add a new supplier",
  "Set up a new supplier and product",
  "Change a supplier's lead time",
  "Update a supplier's email",
  "Rename a supplier",
  "Suppliers on a map, click to edit",
  // Lookups that end in an action
  "Top customers, with a New order button",
  "Search products and edit one",
  "Find a customer and edit them",
  "Find an order and change its status",
  "Orders over $500, with status buttons",
  "Suppliers by lead time, editable",
  "Today's orders, with status buttons",
  "This week's returns, with an Undo",
  "Stock by category, with a Receive form",
  "This week's revenue and orders to ship",
  "A customer's orders, cancel or repeat",
];

export type PageIdea = { name: string; prompt: string };

const PAGE_IDEAS: PageIdea[] = [
  {
    name: "Order desk",
    prompt:
      "Orders in tabs by status, with the count on each tab. Every row has the next action for its status: Mark paid, Ship or Mark delivered, plus Cancel with a confirm step. Tabs and counts update after each action.",
  },
  {
    name: "Order board",
    prompt:
      "A kanban board of orders with a column per status. Dragging a card to another column changes the order's status. Clicking a card opens the order in a side panel with its customer, product and total.",
  },
  {
    name: "Order builder",
    prompt:
      "Pick a customer and a product and set the quantity; the unit price, total and stock left update as I type, with a warning when the quantity is more than the stock. Create the order and show today's orders below.",
  },
  {
    name: "Restock planner",
    prompt:
      "Products at 10 units or fewer, most urgent first by stock and supplier lead time, with a suggested reorder quantity per row. A Receive button records the delivery. A chart shows units per category.",
  },
  {
    name: "Price editor",
    prompt:
      "A searchable price list, sortable by name or price. Edit a price in its row, see the change in percent before saving, and ask for confirmation when the change is over 20%.",
  },
  {
    name: "Receiving desk",
    prompt:
      "Record deliveries: pick a product, enter the quantity and a note, and see its stock before and after. Saving logs a received movement. List today's receipts below, each with an Undo that logs the reverse movement.",
  },
  {
    name: "Customer desk",
    prompt:
      "Search customers. Picking one shows an editable form with their details, their orders with a status action per row, and a form to place a new order for them.",
  },
  {
    name: "Supplier map",
    prompt:
      "Suppliers on a map and in a table. Clicking a marker or a row opens a side panel with the supplier's products and a form to edit its lead time and email.",
  },
  {
    name: "Payments",
    prompt:
      "Pending orders, oldest first, with the customer, total and how many days they have waited. A Mark paid button on each row, and the total still unpaid at the top, updating after each payment.",
  },
  {
    name: "Shipping queue",
    prompt:
      "Paid orders waiting to ship, oldest first, with the customer, product and quantity. A Ship button on each row, and a counter of what is left to ship.",
  },
  {
    name: "Product manager",
    prompt:
      "A product grid with search and a category filter. Each card opens a modal to edit the product. An Add product button opens a form in a side panel.",
  },
  {
    name: "Stock count",
    prompt:
      "A count sheet for one category: each product with its stock and an input for the counted units. Saving a row logs an adjustment for the difference. Show today's adjustments below.",
  },
  {
    name: "Returns desk",
    prompt:
      "Log a return: find the order, set the quantity and a note, and put the units back in stock. List this month's returns with the refunded value of each.",
  },
  {
    name: "Weekly ops",
    prompt:
      "This week at a glance: revenue, orders by status and the low-stock count as stat cards, a daily revenue chart, and three action lists: orders to ship, payments to collect and products to restock, each with its button.",
  },
  {
    name: "Sales by day",
    prompt:
      "Pick a day from the last 30 and see its revenue, its orders with a status action per row, and how it compares to the average day.",
  },
  {
    name: "Customer onboarding",
    prompt:
      "A step-by-step flow: add a customer, pick a product and a quantity for their first order with a live total, then confirm. Show the new customer and the order at the end.",
  },
  {
    name: "Category manager",
    prompt:
      "Pick a category and see its products with stock and value, a chart of units per product, and controls on each row to change the price or record a delivery.",
  },
  {
    name: "Low-stock alerts",
    prompt:
      "An alert for every product at 5 units or fewer, with its supplier and lead time, and a small form inside each alert to record a delivery.",
  },
  {
    name: "Supplier onboarding",
    prompt:
      "A three-step wizard with a stepper: add a supplier, add its first product, then receive opening stock. Show a summary at the end.",
  },
  {
    name: "Order lookup",
    prompt:
      "Search orders by customer or product and filter by status. Open an order in a modal to change its status or quantity, or delete it with a confirm step.",
  },
  {
    name: "Price review",
    prompt:
      "Products with a price range slider and a category filter. Each row has -5%, +5% and a custom price, with the new price shown before saving.",
  },
  {
    name: "Stock ledger",
    prompt:
      "The stock ledger with filters for reason and product, totals in and out, and a form to log a movement. Each entry has an Undo that logs the reverse movement.",
  },
  {
    name: "Customer cleanup",
    prompt:
      "Customers with no orders yet, with an Edit and a Delete button on each row; Delete asks first. Show how many are left.",
  },
  {
    name: "Top customers",
    prompt:
      "The top 10 customers by lifetime spend as a bar chart and a table. A New order button on each row opens an order form for that customer.",
  },
  {
    name: "Supplier scorecard",
    prompt:
      "Suppliers ranked by lead time, with their product count. Edit a lead time in its row; the ranking updates after saving.",
  },
  {
    name: "Daily close",
    prompt:
      "The end of the day: today's revenue at the top, today's orders with their status actions, and today's stock movements with an Undo on each.",
  },
  {
    name: "Reorder desk",
    prompt:
      "Pick a customer and see their past orders, each with a Repeat button that places the same order again after I confirm the quantity.",
  },
  {
    name: "Pricing simulator",
    prompt:
      "Pick a category and a price change in percent. See each product's old and new price and the change in stock value, and apply the new price one product at a time.",
  },
  {
    name: "Warehouse inbox",
    prompt:
      "One inbox of everything that needs a click today: payments to collect, orders to ship and products to restock. Each item has its button and leaves the list when done.",
  },
  {
    name: "Product launch",
    prompt:
      "Add a product: name, SKU, category, supplier, price and opening stock, with a live preview card. Saving creates the product and records the opening stock.",
  },
];

// Runs on the server per request, so every reload shows a different set.
function pick<T>(items: T[], count = 4) {
  const pool = [...items];
  return Array.from({ length: count }, () => pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
}

export const pickChatSuggestions = (asked: string[] = []) =>
  pick(
    CHAT_SUGGESTIONS.filter((s) => !asked.includes(s)),
    3,
  );
export const pickPageIdeas = () => pick(PAGE_IDEAS);
