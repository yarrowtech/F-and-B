import express from "express";
import auth from "../middlewares/auth.middleware.js";
import allowRoles from "../middlewares/role.middleware.js";

import {
  getKitchenSections,
  createKitchenSection,
  updateKitchenSection,
  deleteKitchenSection,
} from "../controllers/kitchenSection.controller.js";

const router = express.Router();

/* ================= LIST ================= */
/* GET /api/kitchen-sections/:restaurantId */
router.get(
  "/:restaurantId",
  auth,
  allowRoles("admin", "manager", "chef", "inventory_manager"),
  getKitchenSections
);

/* ================= CREATE ================= */
/* POST /api/kitchen-sections/:restaurantId */
router.post(
  "/:restaurantId",
  auth,
  allowRoles("admin", "manager"),
  createKitchenSection
);

/* ================= UPDATE ================= */
/* PUT /api/kitchen-sections/:restaurantId/:id */
router.put(
  "/:restaurantId/:id",
  auth,
  allowRoles("admin", "manager"),
  updateKitchenSection
);

/* ================= DELETE ================= */
/* DELETE /api/kitchen-sections/:restaurantId/:id */
router.delete(
  "/:restaurantId/:id",
  auth,
  allowRoles("admin", "manager"),
  deleteKitchenSection
);

export default router;
