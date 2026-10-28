import type { StandardToolV0 } from "standard-tool";
import { downloadCsv } from "@/tools/download-csv";
import { getCustomer, listCustomers } from "@/tools/customers";
import { now } from "@/tools/now";
import { getOrder, listOrders } from "@/tools/orders";
import { getProduct, listProducts } from "@/tools/products";
import { listStockMovements } from "@/tools/stock-movements";
import { getSalesSummary, getStockSummary } from "@/tools/summaries";
import { getSupplier, listSuppliers } from "@/tools/suppliers";

// What the chat's expr tool calls: reads and the CSV download. Writes stay behind the UI's own controls.
export const exprToolFunctions: StandardToolV0[] = [
  listCustomers,
  getCustomer,
  listProducts,
  getProduct,
  listOrders,
  getOrder,
  listSuppliers,
  getSupplier,
  listStockMovements,
  getSalesSummary,
  getStockSummary,
  now,
  downloadCsv,
];
