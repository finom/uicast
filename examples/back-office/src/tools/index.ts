import type { StandardToolV0 } from "standard-tool";
import { createCustomer, deleteCustomer, getCustomer, listCustomers, updateCustomer } from "./customers";
import { createOrder, deleteOrder, getOrder, listOrders, updateOrder } from "./orders";
import { createProduct, deleteProduct, getProduct, listProducts, updateProduct } from "./products";
import { createStockMovement, listStockMovements } from "./stock-movements";
import { now } from "./now";
import { getSalesSummary, getStockSummary } from "./summaries";
import { createSupplier, deleteSupplier, getSupplier, listSuppliers, updateSupplier } from "./suppliers";

// Page and entry endpoints are excluded: the page system is not the model's to mutate.
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
  now,
];
