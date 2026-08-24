import express from "express";
import auth from "../middlewares/auth.middleware.js";
import allowRoles from "../middlewares/role.middleware.js";

import {
  getStockByLocation,
  transferStock,
  getStockTransferHistory,
} from "../controllers/inventoryStock.controller.js";

const router = express.Router();

/* ================= STOCK BY LOCATION ================= */
/* GET /api/inventory-stock/:restaurantId */
router.get(
  "/:restaurantId",
  auth,
  allowRoles("admin", "manager", "inventory_manager", "chef"),
  getStockByLocation
);

/* ================= TRANSFER STOCK ================= */
/* POST /api/inventory-stock/:restaurantId/transfer */
router.post(
  "/:restaurantId/transfer",
  auth,
  allowRoles("admin", "manager", "inventory_manager"),
  transferStock
);

/* ================= TRANSFER HISTORY ================= */
/* GET /api/inventory-stock/:restaurantId/transfers */
router.get(
  "/:restaurantId/transfers",
  auth,
  allowRoles("admin", "manager", "inventory_manager"),
  getStockTransferHistory
);

export default router;
