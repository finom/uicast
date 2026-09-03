import type { StandardToolV0 } from "standard-tool";
import {
  createCustomer,
  deleteCustomer,
  getCustomer,
  listCustomers,
  updateCustomer,
} from "./customers";
import { createOrder, deleteOrder, getOrder, listOrders, updateOrder } from "./orders";
import {
  createProduct,
  deleteProduct,
  getProduct,
  listProducts,
  updateProduct,
} from "./products";
import { createStockMovement, listStockMovements } from "./stock-movements";
import { getSalesSummary, getStockSummary } from "./summaries";
import {
  createSupplier,
  deleteSupplier,
  getSupplier,
  listSuppliers,
  updateSupplier,
} from "./suppliers";

export * from "./customers";
export * from "./orders";
export * from "./products";
export * from "./stock-movements";
export * from "./summaries";
export * from "./suppliers";

// The full set handed to the prompt assembler (getFunctionsPartialPrompt) so the
// model can call these endpoints from a generated page. Page/entry endpoints are
// intentionally excluded — the page system isn't the model's to mutate.
export const domainTools: StandardToolV0[] = [
  listCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  listOrders,
  getOrder,
  createOrder,
  updateOrder,
  deleteOrder,
  listSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  listStockMovements,
  createStockMovement,
  getSalesSummary,
  getStockSummary,
];
