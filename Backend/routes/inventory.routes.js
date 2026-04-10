import express from "express";
import auth from "../middlewares/auth.middleware.js";
import allowRoles from "../middlewares/role.middleware.js";

import {
  createInventoryItem,
  getInventory,
  updateInventoryItem,
  deleteInventoryItem,
  getManagerInventory,
  getItemLogs,
  addStockToItem,
  getMyInventoryStats,
  getInventoryCategories,
  addInventoryCategory,
} from "../controllers/inventory.controller.js";

const router = express.Router();

/* ================= MANAGER INVENTORY VIEW ================= */
/* GET /api/inventory/manager */
router.get(
  "/manager",
  auth,
  allowRoles("admin", "manager"),
  getManagerInventory
);

/* ================= INVENTORY MANAGER DASHBOARD STATS ================= */
/* GET /api/inventory/my-stats */
router.get(
  "/my-stats",
  auth,
  allowRoles("inventory_manager"),
  getMyInventoryStats
);

/* ================= INVENTORY CATEGORIES ================= */
/* GET  /api/inventory/categories */
router.get(
  "/categories",
  auth,
  allowRoles("admin", "manager", "inventory_manager"),
  getInventoryCategories
);

/* POST /api/inventory/categories */
router.post(
  "/categories",
  auth,
  allowRoles("admin", "manager", "inventory_manager"),
  addInventoryCategory
);

/* ================= INVENTORY LOGS ================= */
/* GET /api/inventory/logs/:itemId */
router.get(
  "/logs/:itemId",
  auth,
  allowRoles("admin", "manager", "inventory_manager"),
  getItemLogs
);

/* ================= CREATE ================= */
/* POST /api/inventory/:restaurantId */
router.post(
  "/:restaurantId",
  auth,
  allowRoles("admin", "manager", "inventory_manager"),
  createInventoryItem
);

/* ================= GET INVENTORY ================= */
/* GET /api/inventory/:restaurantId */
router.get(
  "/:restaurantId",
  auth,
  allowRoles("admin", "manager", "chef", "inventory_manager"),
  getInventory
);

/* ================= UPDATE ================= */
/* PUT /api/inventory/:restaurantId/:id */
router.put(
  "/:restaurantId/:id",
  auth,
  allowRoles("admin", "manager", "inventory_manager"),
  updateInventoryItem
);

/* ================= ADD STOCK ================= */
/* PUT /api/inventory/:restaurantId/:id/add-stock */
router.put(
  "/:restaurantId/:id/add-stock",
  auth,
  allowRoles("admin", "manager", "inventory_manager"),
  addStockToItem
);

/* ================= DELETE ================= */
/* DELETE /api/inventory/:restaurantId/:id */
router.delete(
  "/:restaurantId/:id",
  auth,
  allowRoles("admin", "inventory_manager"),
  deleteInventoryItem
);

export default router;