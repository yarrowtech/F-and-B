import express from "express";
import { getInventoryDashboard } from "../controllers/inventoryDashboard.controller.js";
import auth from "../middlewares/auth.middleware.js";
import allowRoles from "../middlewares/role.middleware.js";
import { cacheResponse } from "../middlewares/cache.middleware.js";

const router = express.Router();

/*
========================================
INVENTORY DASHBOARD
GET /api/inventory/dashboard
========================================
*/

router.get(
  "/dashboard",
  auth,
  allowRoles("inventory_manager"),
  cacheResponse({
    ttlSeconds: 30,
    namespace: "dashboard",
  }),
  getInventoryDashboard
);

export default router;
