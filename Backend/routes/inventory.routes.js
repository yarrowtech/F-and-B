import express from "express";
import auth from "../middlewares/auth.middleware.js";
import allowRoles from "../middlewares/role.middleware.js";

import {
  createInventoryItem,
  getInventory,
  updateInventoryItem,
  deleteInventoryItem,
} from "../controllers/inventory.controller.js";

const router = express.Router();

/*
Base mounted in server.js:
app.use("/api/inventory", inventoryRoutes);
*/

/* ================= CREATE ================= */
/* POST /api/inventory/:restaurantId */
router.post(
  "/:restaurantId",
  auth,
  allowRoles("admin", "manager", "inventory_manager"),
  createInventoryItem
);

/* ================= GET ================= */
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

/* ================= DELETE ================= */
/* DELETE /api/inventory/:restaurantId/:id */
router.delete(
  "/:restaurantId/:id",
  auth,
  allowRoles("admin", "inventory_manager"),
  deleteInventoryItem
);

export default router;
